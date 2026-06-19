import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { AccountEntity } from '../accounts/infrastructure/persistence/relational/entities/account.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  KycDecisionSource,
  KycOcrStatus,
  KycStatus,
  KycVerificationEntity,
} from './entities/kyc-verification.entity';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ApproveKycDto, RejectKycDto } from './dto/review-kyc.dto';
import { QueryKycDto } from './dto/query-kyc.dto';
import { KycBookingEligibilityDto, KycResponseDto } from './dto/kyc-response.dto';
import { KycFileKind, KycFileStorageService } from './kyc-file-storage.service';
import { KycOcrService } from './kyc-ocr.service';

export interface KycSubmissionFiles {
  idFront: any;
  idBack: any;
  selfie?: any;
}

const KYC_PROCESSING_PURPOSE = 'identity_verification_and_booking_safety';
const DEFAULT_CONSENT_VERSION = 'kyc-consent-v2';
const DEFAULT_RETENTION_POLICY_VERSION = 'kyc-retention-v1';

@Injectable()
export class KycVerificationsService {
  constructor(
    @InjectRepository(KycVerificationEntity, 'iamUserConnection')
    private readonly kycRepository: Repository<KycVerificationEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    private readonly fileStorage: KycFileStorageService,
    private readonly ocrService: KycOcrService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async submitForCurrentUser(
    userId: string,
    dto: SubmitKycDto,
    files: KycSubmissionFiles,
  ): Promise<KycResponseDto> {
    if (dto.idType !== 'CITIZEN_ID') {
      throw new BadRequestException(
        'Only Vietnamese citizen ID cards are supported',
      );
    }
    if (!/^\d{12}$/.test(dto.idNumber)) {
      throw new BadRequestException(
        'Enter the 12-digit number printed on your citizen ID.',
      );
    }
    if (!files.idFront) {
      throw new BadRequestException(
        "We couldn't read the front of your citizen ID. Upload a clearer image with all four corners visible.",
      );
    }
    if (!files.idBack) {
      throw new BadRequestException(
        "We couldn't read the back of your citizen ID. Upload a clearer image with all four corners visible.",
      );
    }
    if (String(dto.consentAccepted) !== 'true') {
      throw new BadRequestException('KYC consent must be accepted');
    }
    if (String(dto.documentStorageConsentAccepted) !== 'true') {
      throw new BadRequestException('KYC document storage consent must be accepted');
    }
    if (String(dto.ocrProcessingConsentAccepted) !== 'true') {
      throw new BadRequestException('KYC OCR processing consent must be accepted');
    }
    if (String(dto.noMarketingConsentAccepted) !== 'true') {
      throw new BadRequestException('KYC no-marketing acknowledgement must be accepted');
    }

    const existingPending = await this.kycRepository.findOne({
      where: { user_id: userId, verification_status: KycStatus.PENDING_REVIEW },
      order: { created_at: 'DESC' },
    });
    if (existingPending) {
      throw new BadRequestException('A KYC request is already pending review');
    }

    const kycId = randomUUID();
    const idFront = await this.fileStorage.save(files.idFront, { userId, kycId, kind: 'idFront' });
    const idBack = await this.fileStorage.save(files.idBack, { userId, kycId, kind: 'idBack' });
    const now = new Date();
    const retentionExpiresAt = this.retentionExpiresAt(now);
    const entity = this.kycRepository.create({
      kyc_id: kycId,
      user_id: userId,
      id_type: dto.idType,
      id_number: dto.idNumber,
      full_name: dto.fullName,
      date_of_birth: dto.dateOfBirth,
      id_front_image: idFront.path,
      id_back_image: idBack.path,
      selfie_image: null,
      verification_status: KycStatus.PENDING_REVIEW,
      // When no OCR engine is wired (KYC_OCR_ENABLED!=='true'), mark OCR as
      // SKIPPED instead of PENDING. Otherwise the async poller never runs, the
      // status stays PENDING forever, and approve() is permanently blocked
      // ("cannot be approved while OCR is pending") — a deadlock in any
      // environment without OCR. SKIPPED lets reviewers approve manually.
      ocr_status:
        process.env.KYC_OCR_ENABLED === 'true'
          ? KycOcrStatus.PENDING
          : KycOcrStatus.SKIPPED,
      ocr_confidence: null,
      ocr_payload: null,
      ocr_attempts: 0,
      ocr_last_error: null,
      ocr_processed_at: null,
      document_hash: idFront.sha256,
      notes: dto.notes ?? null,
      admin_notes: null,
      rejection_reason: null,
      submitted_at: now,
      verified_at: null,
      verified_by: null,
      decision_source: null,
      decision_reason: null,
      consent_version: dto.consentVersion ?? DEFAULT_CONSENT_VERSION,
      consent_accepted_at: now,
      document_storage_consent_accepted_at: now,
      ocr_processing_consent_accepted_at: now,
      no_marketing_consent_accepted_at: now,
      processing_purpose: KYC_PROCESSING_PURPOSE,
      retention_policy_version: dto.retentionPolicyVersion ?? DEFAULT_RETENTION_POLICY_VERSION,
      retention_expires_at: retentionExpiresAt,
      deleted_at: null,
      created_by: userId,
      updated_by: userId,
    });

    const saved = await this.kycRepository.save(entity);
    await this.auditLogsService.create({
      user_id: userId,
      action: 'KYC_SUBMITTED',
      resource: 'kyc',
      resource_id: saved.kyc_id,
      details: { status: saved.verification_status, idNumberMasked: this.maskIdNumber(saved.id_number) },
    });

    return this.toPatientResponse(saved);
  }

  async findMine(userId: string): Promise<KycResponseDto> {
    const entity = await this.findLatestByUser(userId);
    return entity
      ? this.toPatientResponse(entity)
      : {
          status: KycStatus.NOT_SUBMITTED,
          statusMessage: 'Upload your citizen ID to verify your identity.',
        };
  }

  async findMineHistory(userId: string): Promise<KycResponseDto[]> {
    const rows = await this.kycRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    return rows.map((row) => this.toPatientResponse(row));
  }

  async findAll(query: QueryKycDto): Promise<{ data: KycResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.kycRepository
      .createQueryBuilder('kyc')
      .orderBy('kyc.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.status) {
      builder.andWhere('kyc.verification_status = :status', {
        status: query.status,
      });
    }
    if (query.ocrStatus) {
      builder.andWhere('kyc.ocr_status = :ocrStatus', {
        ocrStatus: query.ocrStatus,
      });
    }
    if (query.decisionSource) {
      builder.andWhere('kyc.decision_source = :decisionSource', {
        decisionSource: query.decisionSource,
      });
    }
    if (query.fromDate) {
      builder.andWhere('kyc.submitted_at >= :fromDate', {
        fromDate: new Date(query.fromDate),
      });
    }
    if (query.toDate) {
      const toDate = new Date(query.toDate);
      toDate.setUTCHours(23, 59, 59, 999);
      builder.andWhere('kyc.submitted_at <= :toDate', { toDate });
    }
    const search = query.search?.trim();
    if (search) {
      const normalized = search.toLowerCase();
      const digits = search.replace(/\D/g, '');
      builder.andWhere(
        digits.length === 4
          ? '(LOWER(kyc.full_name) LIKE :search OR RIGHT(kyc.id_number, 4) = :lastFour)'
          : 'LOWER(kyc.full_name) LIKE :search',
        {
          search: `%${normalized}%`,
          lastFour: digits,
        },
      );
    }
    const [rows, total] = await builder.getManyAndCount();

    return {
      data: rows.map((row) => this.toAdminResponse(row)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<KycVerificationEntity> {
    const entity = await this.kycRepository.findOne({ where: { kyc_id: id } });
    if (!entity) {
      throw new NotFoundException(`KYC request ${id} not found`);
    }
    return entity;
  }

  async findOneResponse(id: string): Promise<KycResponseDto> {
    const entity = await this.findOne(id);
    return this.toAdminResponse(entity);
  }

  async approve(id: string, reviewerId: string, dto: ApproveKycDto): Promise<KycResponseDto> {
    const entity = await this.findOne(id);
    this.assertPendingReview(entity);
    if (
      entity.ocr_status === KycOcrStatus.PENDING ||
      entity.ocr_status === KycOcrStatus.PROCESSING
    ) {
      throw new BadRequestException(
        'KYC cannot be approved while OCR is pending or processing',
      );
    }
    if (this.getOcrRiskLevel(entity) === 'HIGH') {
      throw new BadRequestException(
        'High-risk KYC submissions cannot be approved. Reject the submission and ask the user to resubmit clear matching documents.',
      );
    }

    entity.verification_status = KycStatus.VERIFIED;
    entity.verified_at = new Date();
    entity.verified_by = reviewerId;
    entity.decision_source = KycDecisionSource.MANUAL;
    entity.decision_reason =
      dto.adminNotes?.trim() || 'Approved after manual review.';
    entity.admin_notes = dto.adminNotes ?? null;
    entity.rejection_reason = null;
    entity.updated_by = reviewerId;

    const saved = await this.kycRepository.save(entity);
    await this.auditLogsService.create({
      user_id: reviewerId,
      action: 'KYC_APPROVED',
      resource: 'kyc',
      resource_id: id,
      details: { subjectUserId: saved.user_id },
    });
    return this.toAdminResponse(saved);
  }

  async reject(id: string, reviewerId: string, dto: RejectKycDto): Promise<KycResponseDto> {
    const entity = await this.findOne(id);
    this.assertPendingReview(entity);
    entity.verification_status = KycStatus.REJECTED;
    entity.verified_at = null;
    entity.verified_by = reviewerId;
    entity.decision_source = KycDecisionSource.MANUAL;
    entity.decision_reason = dto.rejectionReason;
    entity.rejection_reason = dto.rejectionReason;
    entity.admin_notes = dto.adminNotes ?? null;
    entity.updated_by = reviewerId;

    const saved = await this.kycRepository.save(entity);
    await this.auditLogsService.create({
      user_id: reviewerId,
      action: 'KYC_REJECTED',
      resource: 'kyc',
      resource_id: id,
      details: { subjectUserId: saved.user_id, reason: dto.rejectionReason },
    });
    return this.toAdminResponse(saved);
  }

  async getBookingEligibility(userId: string): Promise<KycBookingEligibilityDto> {
    const [account, latestKyc] = await Promise.all([
      this.accountRepository.findOne({ where: { accountId: userId } }),
      this.findLatestByUser(userId),
    ]);
    const phoneVerified = Boolean(account?.phoneVerified);
    const kycStatus = latestKyc?.verification_status ?? KycStatus.NOT_SUBMITTED;
    return {
      userId,
      phoneVerified,
      kycStatus,
      canBook: phoneVerified && kycStatus === KycStatus.VERIFIED,
    };
  }

  async getPrivateFilePath(id: string, kind: KycFileKind): Promise<string> {
    const entity = await this.findOne(id);
    const map: Record<KycFileKind, string | null> = {
      idFront: entity.id_front_image,
      idBack: entity.id_back_image,
      selfie: entity.selfie_image,
    };
    const relativePath = map[kind];
    if (!relativePath) {
      throw new NotFoundException(`${kind} file not found`);
    }
    return this.fileStorage.decryptToTempFile(relativePath);
  }

  async removeTemporaryFile(path: string): Promise<void> {
    await this.fileStorage.removeTempFile(path);
  }

  assertInternalApiKey(value: string | undefined): void {
    const expected = process.env.IAM_INTERNAL_API_KEY || 'smile-internal-dev-key';
    if (!value || value !== expected) {
      throw new ForbiddenException('Invalid internal API key');
    }
  }

  private async findLatestByUser(userId: string): Promise<KycVerificationEntity | null> {
    return this.kycRepository.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  private getOcrRiskLevel(entity: KycVerificationEntity): string | null {
    const payload = entity.ocr_payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }

    const riskLevel = (payload as Record<string, unknown>).riskLevel;
    return typeof riskLevel === 'string' ? riskLevel.toUpperCase() : null;
  }

  private assertPendingReview(entity: KycVerificationEntity): void {
    if (entity.verification_status !== KycStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `KYC request is already ${entity.verification_status}`,
      );
    }
  }

  private retentionExpiresAt(start: Date): Date {
    const retentionDays = Number(process.env.KYC_RETENTION_DAYS || 365);
    const safeRetentionDays = Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 365;
    return new Date(start.getTime() + safeRetentionDays * 24 * 60 * 60 * 1000);
  }

  private baseResponse(entity: KycVerificationEntity): KycResponseDto {
    const legacyTerminalDecision =
      entity.verification_status === KycStatus.VERIFIED ||
      entity.verification_status === KycStatus.REJECTED;
    return {
      kycId: entity.kyc_id,
      status: entity.verification_status,
      idType: entity.id_type,
      fullName: entity.full_name,
      dateOfBirth: entity.date_of_birth,
      idNumberMasked: this.maskIdNumber(entity.id_number),
      ocrStatus: entity.ocr_status,
      ocrConfidence: entity.ocr_confidence,
      statusMessage: this.patientStatusMessage(entity),
      decisionSource:
        entity.decision_source ??
        (legacyTerminalDecision ? KycDecisionSource.MANUAL : null),
      decisionReason:
        entity.decision_reason ??
        entity.rejection_reason ??
        (entity.verification_status === KycStatus.VERIFIED
          ? 'Approved after manual review.'
          : null),
      ocrProcessedAt: entity.ocr_processed_at,
      rejectionReason: entity.rejection_reason,
      adminNotes: entity.admin_notes,
      notes: entity.notes,
      consentVersion: entity.consent_version,
      documentStorageConsentAcceptedAt: entity.document_storage_consent_accepted_at,
      ocrProcessingConsentAcceptedAt: entity.ocr_processing_consent_accepted_at,
      noMarketingConsentAcceptedAt: entity.no_marketing_consent_accepted_at,
      processingPurpose: entity.processing_purpose,
      retentionPolicyVersion: entity.retention_policy_version,
      retentionExpiresAt: entity.retention_expires_at,
      deletedAt: entity.deleted_at,
      submittedAt: entity.submitted_at,
      verifiedAt: entity.verified_at,
    };
  }

  private toPatientResponse(entity: KycVerificationEntity): KycResponseDto {
    const response = this.baseResponse(entity);
    delete response.adminNotes;
    return response;
  }

  private toAdminResponse(entity: KycVerificationEntity): KycResponseDto {
    return {
      ...this.baseResponse(entity),
      ocrPayload: entity.ocr_payload,
      ocrLastError: entity.ocr_last_error,
    };
  }

  private patientStatusMessage(entity: KycVerificationEntity): string {
    if (entity.verification_status === KycStatus.VERIFIED) {
      return entity.decision_source === KycDecisionSource.AUTO
        ? 'Your identity was verified automatically.'
        : 'Your identity was verified after review.';
    }
    if (entity.verification_status === KycStatus.REJECTED) {
      return entity.rejection_reason || 'Your submission needs updated documents.';
    }
    if (
      entity.ocr_status === KycOcrStatus.PENDING ||
      entity.ocr_status === KycOcrStatus.PROCESSING
    ) {
      return 'We are reading your citizen ID. This usually takes a short moment.';
    }
    if (entity.ocr_status === KycOcrStatus.FAILED) {
      return "We couldn't complete automatic document reading. Your submission is safe and has been sent for manual review.";
    }
    return 'Your documents were submitted successfully and need a manual review.';
  }

  private maskIdNumber(value: string): string {
    if (!value) return '';
    return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
  }
}
