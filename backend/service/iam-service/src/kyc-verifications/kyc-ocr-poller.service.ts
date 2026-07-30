import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { KycDecisionSource, KycOcrStatus, KycStatus, KycVerificationEntity } from './entities/kyc-verification.entity';
import { KycAutoVerificationService } from './kyc-auto-verification.service';
import { KycFileStorageService } from './kyc-file-storage.service';
import { KycOcrAssessmentService } from './kyc-ocr-assessment.service';
import { KycOcrService } from './kyc-ocr.service';
import { getSanitizedErrorMetadata, normalizeStoredErrorMetadata } from '../common/error-metadata';

@Injectable()
export class KycOcrPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KycOcrPollerService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    @InjectRepository(KycVerificationEntity, 'iamUserConnection')
    private readonly kycRepository: Repository<KycVerificationEntity>,
    private readonly fileStorage: KycFileStorageService,
    private readonly ocrService: KycOcrService,
    private readonly assessmentService: KycOcrAssessmentService,
    private readonly autoVerificationService: KycAutoVerificationService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  onModuleInit(): void {
    if (!this.isEnabled()) {
      return;
    }

    const intervalMs = this.getNumberEnv('KYC_OCR_INTERVAL_MS', 5000);
    this.timer = setInterval(() => {
      void this.processPendingOnce();
    }, intervalMs);
    this.timer.unref?.();
    void this.processPendingOnce();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async processPendingOnce(): Promise<void> {
    if (!this.isEnabled() || this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const batchSize = this.getNumberEnv('KYC_OCR_BATCH_SIZE', 2);
      const maxAttempts = this.getNumberEnv('KYC_OCR_MAX_ATTEMPTS', 3);
      await this.recoverStaleProcessingJobs();
      const jobs = await this.kycRepository.find({
        where: {
          verification_status: KycStatus.PENDING_REVIEW,
          ocr_status: KycOcrStatus.PENDING,
          ocr_attempts: LessThan(maxAttempts),
        },
        order: { created_at: 'ASC' },
        take: batchSize,
      });

      for (const job of jobs) {
        await this.processOne(job, maxAttempts);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async processOne(entity: KycVerificationEntity, maxAttempts: number): Promise<void> {
    entity.ocr_status = KycOcrStatus.PROCESSING;
    entity.ocr_attempts = (entity.ocr_attempts ?? 0) + 1;
    entity.ocr_last_error = null;
    await this.kycRepository.save({ ...entity });

    let tempFrontPath: string | null = null;
    let tempBackPath: string | null = null;
    try {
      if (!entity.id_front_image || !entity.id_back_image) {
        throw new Error('KYC front/back images are missing');
      }

      tempFrontPath = await this.fileStorage.decryptToTempFile(entity.id_front_image);
      tempBackPath = await this.fileStorage.decryptToTempFile(entity.id_back_image);
      const result = await this.ocrService.extractIdentity({
        idFrontPath: tempFrontPath,
        idBackPath: tempBackPath,
        expectedIdNumber: entity.id_number,
        expectedDateOfBirth: entity.date_of_birth,
      });

      const completed = result.status === KycOcrStatus.COMPLETED;
      entity.ocr_status = completed ? KycOcrStatus.COMPLETED : this.failureStatus(entity.ocr_attempts, maxAttempts);
      entity.ocr_confidence = result.confidence;
      const assessedPayload = this.withAssessment(entity, result);
      const storedError = completed ? null : normalizeStoredErrorMetadata(assessedPayload.error, 'OcrProviderError');
      entity.ocr_payload = storedError ? { ...assessedPayload, error: storedError } : assessedPayload;
      entity.ocr_last_error = storedError;
      entity.ocr_processed_at = entity.ocr_status === KycOcrStatus.PENDING ? null : new Date();
      const autoVerified = this.applyAutomaticDecision(entity);
      await this.kycRepository.save(entity);
      if (autoVerified) {
        await this.auditLogsService.create({
          user_id: entity.user_id,
          action: 'KYC_AUTO_VERIFIED',
          resource: 'kyc_verification',
          resource_id: entity.kyc_id,
          details: {
            decision_source: KycDecisionSource.AUTO,
            confidence: entity.ocr_confidence,
          },
        });
      }
    } catch (error) {
      const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
      const storedError = `error_class=${errorClass} error_code=${errorCode}`;
      entity.ocr_status = this.failureStatus(entity.ocr_attempts, maxAttempts);
      entity.ocr_confidence = null;
      entity.ocr_payload = { error: storedError };
      entity.ocr_last_error = storedError;
      entity.ocr_processed_at = entity.ocr_status === KycOcrStatus.PENDING ? null : new Date();
      if (entity.ocr_status === KycOcrStatus.FAILED) {
        entity.decision_reason = 'Automatic document reading could not be completed. Manual review is required.';
      }
      await this.kycRepository.save(entity);
      this.logger.warn(`operation=kyc_ocr outcome=failed error_class=${errorClass} error_code=${errorCode}`);
    } finally {
      if (tempFrontPath) {
        await this.fileStorage.removeTempFile(tempFrontPath);
      }
      if (tempBackPath) {
        await this.fileStorage.removeTempFile(tempBackPath);
      }
    }
  }

  private isEnabled(): boolean {
    return process.env.KYC_OCR_ENABLED === 'true';
  }

  private getNumberEnv(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private withAssessment(
    entity: KycVerificationEntity,
    result: {
      status: KycOcrStatus;
      confidence: number | null;
      payload: Record<string, unknown>;
    },
  ): Record<string, unknown> {
    const assessment = this.assessmentService.assess({
      submitted: {
        idNumber: entity.id_number,
        fullName: entity.full_name,
        dateOfBirth: entity.date_of_birth,
      },
      ocr: result,
    });
    const providerRisk = this.riskLevel(result.payload.riskLevel);
    const finalRisk = this.higherRisk(providerRisk, assessment.riskLevel);
    const providerReason = this.failedCheckMessage(result.payload);

    return {
      ...result.payload,
      checks: [...this.payloadChecks(result.payload), ...assessment.checks],
      riskLevel: finalRisk,
      riskReason:
        finalRisk === providerRisk && providerRisk !== assessment.riskLevel
          ? (providerReason ?? 'OCR provider reported a high-risk document check.')
          : assessment.riskReason,
    };
  }

  private applyAutomaticDecision(entity: KycVerificationEntity): boolean {
    const decision = this.autoVerificationService.evaluate({
      verificationStatus: entity.verification_status,
      ocrStatus: entity.ocr_status,
      confidence: entity.ocr_confidence,
      submitted: {
        idNumber: entity.id_number,
        fullName: entity.full_name,
        dateOfBirth: entity.date_of_birth,
      },
      payload: entity.ocr_payload ?? {},
    });

    entity.decision_reason = decision.eligible ? decision.reason : this.safeManualReviewReason(decision.failedCriteria);
    if (!decision.eligible) {
      return false;
    }

    entity.verification_status = KycStatus.VERIFIED;
    entity.verified_at = new Date();
    entity.verified_by = null;
    entity.decision_source = KycDecisionSource.AUTO;
    return true;
  }

  private safeManualReviewReason(failedCriteria: string[]): string {
    return failedCriteria.length > 0
      ? `Manual review required: ${failedCriteria.join(', ')}.`
      : 'Manual review is required.';
  }

  private async recoverStaleProcessingJobs(): Promise<void> {
    const timeoutMs = this.getNumberEnv('KYC_OCR_TIMEOUT_MS', 30000);
    const staleAfterMs = this.getNumberEnv('KYC_OCR_STALE_PROCESSING_MS', Math.max(timeoutMs * 2, 60000));
    const cutoff = new Date(Date.now() - staleAfterMs);
    await this.kycRepository.update(
      {
        verification_status: KycStatus.PENDING_REVIEW,
        ocr_status: KycOcrStatus.PROCESSING,
        updated_at: LessThanOrEqual(cutoff),
      },
      {
        ocr_status: KycOcrStatus.PENDING,
        ocr_last_error: 'Recovered stale OCR processing job',
        ocr_processed_at: null,
      },
    );
  }

  private failureStatus(attempts: number, maxAttempts: number): KycOcrStatus.PENDING | KycOcrStatus.FAILED {
    return attempts < maxAttempts ? KycOcrStatus.PENDING : KycOcrStatus.FAILED;
  }

  private payloadChecks(payload: Record<string, unknown>): Array<Record<string, unknown>> {
    const checks = payload.automatedChecks;
    return Array.isArray(checks)
      ? (checks.filter((check) => check && typeof check === 'object') as Array<Record<string, unknown>>)
      : [];
  }

  private riskLevel(value: unknown): 'LOW' | 'MEDIUM' | 'HIGH' {
    return value === 'HIGH' || value === 'MEDIUM' ? value : 'LOW';
  }

  private higherRisk(left: 'LOW' | 'MEDIUM' | 'HIGH', right: 'LOW' | 'MEDIUM' | 'HIGH'): 'LOW' | 'MEDIUM' | 'HIGH' {
    const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    return rank[left] >= rank[right] ? left : right;
  }

  private failedCheckMessage(payload: Record<string, unknown>): string | null {
    for (const check of this.payloadChecks(payload)) {
      if (check.status === 'FAIL' && typeof check.message === 'string') {
        return check.message;
      }
    }
    return null;
  }
}
