import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { AccountEntity } from '../accounts/infrastructure/persistence/relational/entities/account.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
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

export type KycSubmissionFiles = Record<KycFileKind, any>;

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
    const selfie = await this.fileStorage.save(files.selfie, { userId, kycId, kind: 'selfie' });
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
      selfie_image: selfie.path,
      verification_status: KycStatus.PENDING_REVIEW,
      ocr_status: KycOcrStatus.PENDING,
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

    return this.toResponse(saved);
  }

  async findMine(userId: string): Promise<KycResponseDto> {
    const entity = await this.findLatestByUser(userId);
    return entity ? this.toResponse(entity) : { status: KycStatus.NOT_SUBMITTED };
  }

  async findMineHistory(userId: string): Promise<KycResponseDto[]> {
    const rows = await this.kycRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async findAll(query: QueryKycDto): Promise<{ data: KycResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: FindOptionsWhere<KycVerificationEntity> = {};
    if (query.status) where.verification_status = query.status;

    const [rows, total] = await this.kycRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data: rows.map((row) => this.toResponse(row)),
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
    return this.toResponse(entity);
  }

  async approve(id: string, reviewerId: string, dto: ApproveKycDto): Promise<KycResponseDto> {
    const entity = await this.findOne(id);
    if (this.getOcrRiskLevel(entity) === 'HIGH') {
      throw new BadRequestException(
        'High-risk KYC submissions cannot be approved. Reject the submission and ask the user to resubmit clear matching documents.',
      );
    }

    entity.verification_status = KycStatus.VERIFIED;
    entity.verified_at = new Date();
    entity.verified_by = reviewerId;
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
    return this.toResponse(saved);
  }

  async reject(id: string, reviewerId: string, dto: RejectKycDto): Promise<KycResponseDto> {
    const entity = await this.findOne(id);
    entity.verification_status = KycStatus.REJECTED;
    entity.verified_at = null;
    entity.verified_by = reviewerId;
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
    return this.toResponse(saved);
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

  private retentionExpiresAt(start: Date): Date {
    const retentionDays = Number(process.env.KYC_RETENTION_DAYS || 365);
    const safeRetentionDays = Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 365;
    return new Date(start.getTime() + safeRetentionDays * 24 * 60 * 60 * 1000);
  }

  private toResponse(entity: KycVerificationEntity): KycResponseDto {
    return {
      kycId: entity.kyc_id,
      status: entity.verification_status,
      idType: entity.id_type,
      fullName: entity.full_name,
      dateOfBirth: entity.date_of_birth,
      idNumberMasked: this.maskIdNumber(entity.id_number),
      ocrStatus: entity.ocr_status,
      ocrConfidence: entity.ocr_confidence,
      ocrPayload: entity.ocr_payload,
      ocrLastError: entity.ocr_last_error,
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

  private maskIdNumber(value: string): string {
    if (!value) return '';
    return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
  }
}
