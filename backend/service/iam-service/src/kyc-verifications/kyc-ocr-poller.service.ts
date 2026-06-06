import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
  KycOcrStatus,
  KycStatus,
  KycVerificationEntity,
} from './entities/kyc-verification.entity';
import { KycFileStorageService } from './kyc-file-storage.service';
import { KycOcrAssessmentService } from './kyc-ocr-assessment.service';
import { KycOcrService } from './kyc-ocr.service';

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
        await this.processOne(job);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async processOne(entity: KycVerificationEntity): Promise<void> {
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

      entity.ocr_status =
        result.status === KycOcrStatus.COMPLETED
          ? KycOcrStatus.COMPLETED
          : KycOcrStatus.FAILED;
      entity.ocr_confidence = result.confidence;
      entity.ocr_payload = this.withAssessment(entity, result);
      entity.ocr_last_error =
        entity.ocr_status === KycOcrStatus.FAILED
          ? this.payloadError(entity.ocr_payload)
          : null;
      entity.ocr_processed_at = new Date();
      await this.kycRepository.save(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR failed';
      entity.ocr_status = KycOcrStatus.FAILED;
      entity.ocr_confidence = null;
      entity.ocr_payload = { error: message };
      entity.ocr_last_error = message;
      entity.ocr_processed_at = new Date();
      await this.kycRepository.save(entity);
      this.logger.warn(`KYC OCR failed for ${entity.kyc_id}: ${message}`);
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

  private payloadError(payload: Record<string, unknown>): string | null {
    return typeof payload.error === 'string' ? payload.error : null;
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

    return {
      ...result.payload,
      checks: [
        ...this.payloadChecks(result.payload),
        ...assessment.checks,
      ],
      riskLevel: assessment.riskLevel,
      riskReason: assessment.riskReason,
    };
  }

  private payloadChecks(payload: Record<string, unknown>): Array<Record<string, unknown>> {
    const checks = payload.automatedChecks;
    return Array.isArray(checks) ? checks.filter((check) => check && typeof check === 'object') as Array<Record<string, unknown>> : [];
  }
}
