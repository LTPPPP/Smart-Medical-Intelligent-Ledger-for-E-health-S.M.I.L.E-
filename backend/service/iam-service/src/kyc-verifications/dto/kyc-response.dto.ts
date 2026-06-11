import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycOcrStatus, KycStatus } from '../entities/kyc-verification.entity';

export class KycResponseDto {
  @ApiPropertyOptional()
  kycId?: string;

  @ApiProperty({ enum: KycStatus })
  status: KycStatus;

  @ApiPropertyOptional()
  idType?: string;

  @ApiPropertyOptional()
  fullName?: string | null;

  @ApiPropertyOptional()
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ example: '********6789' })
  idNumberMasked?: string;

  @ApiPropertyOptional({ enum: KycOcrStatus })
  ocrStatus?: KycOcrStatus;

  @ApiPropertyOptional({ example: 83 })
  ocrConfidence?: number | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, nullable: true })
  ocrPayload?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  ocrLastError?: string | null;

  @ApiPropertyOptional()
  ocrProcessedAt?: Date | null;

  @ApiPropertyOptional()
  rejectionReason?: string | null;

  @ApiPropertyOptional()
  adminNotes?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  consentVersion?: string | null;

  @ApiPropertyOptional()
  documentStorageConsentAcceptedAt?: Date | null;

  @ApiPropertyOptional()
  ocrProcessingConsentAcceptedAt?: Date | null;

  @ApiPropertyOptional()
  noMarketingConsentAcceptedAt?: Date | null;

  @ApiPropertyOptional()
  processingPurpose?: string | null;

  @ApiPropertyOptional()
  retentionPolicyVersion?: string | null;

  @ApiPropertyOptional()
  retentionExpiresAt?: Date | null;

  @ApiPropertyOptional()
  deletedAt?: Date | null;

  @ApiPropertyOptional()
  submittedAt?: Date | null;

  @ApiPropertyOptional()
  verifiedAt?: Date | null;
}

export class KycBookingEligibilityDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  phoneVerified: boolean;

  @ApiProperty({ enum: KycStatus })
  kycStatus: KycStatus;

  @ApiProperty()
  canBook: boolean;
}
