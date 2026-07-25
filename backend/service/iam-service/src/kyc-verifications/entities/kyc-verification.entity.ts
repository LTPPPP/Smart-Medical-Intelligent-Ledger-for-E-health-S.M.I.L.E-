import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum KycOcrStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SKIPPED = 'SKIPPED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum KycDecisionSource {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

@Entity({ name: 'kyc_verifications' })
export class KycVerificationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'kyc_id' })
  kyc_id: string;

  @Index('idx_kyc_user')
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 50, name: 'id_type' })
  id_type: string;

  @Column({ type: 'varchar', length: 100, name: 'id_number' })
  id_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'full_name' })
  full_name: string | null;

  @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
  date_of_birth: string | null;

  @Column({ type: 'text', nullable: true, name: 'id_front_image' })
  id_front_image: string | null;

  @Column({ type: 'text', nullable: true, name: 'id_back_image' })
  id_back_image: string | null;

  @Column({ type: 'text', nullable: true, name: 'selfie_image' })
  selfie_image: string | null;

  @Index('idx_kyc_status')
  @Column({
    type: 'varchar',
    length: 14,
    default: KycStatus.PENDING_REVIEW,
    name: 'verification_status',
  })
  verification_status: KycStatus;

  @Column({
    type: 'varchar',
    length: 10,
    default: KycOcrStatus.PENDING,
    name: 'ocr_status',
  })
  ocr_status: KycOcrStatus;

  @Column({ type: 'int', nullable: true, name: 'ocr_confidence' })
  ocr_confidence: number | null;

  @Column({ type: 'jsonb', nullable: true, name: 'ocr_payload' })
  ocr_payload: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0, name: 'ocr_attempts' })
  ocr_attempts: number;

  @Column({ type: 'text', nullable: true, name: 'ocr_last_error' })
  ocr_last_error: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'ocr_processed_at' })
  ocr_processed_at: Date | null;

  @Column({ type: 'char', length: 64, nullable: true, name: 'document_hash' })
  document_hash: string | null;

  @Column({ type: 'text', nullable: true, name: 'notes' })
  notes: string | null;

  @Column({ type: 'text', nullable: true, name: 'admin_notes' })
  admin_notes: string | null;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejection_reason: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'submitted_at' })
  submitted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
  verified_at: Date | null;

  @Column({ type: 'uuid', nullable: true, name: 'verified_by' })
  verified_by: string | null;

  @Column({ type: 'varchar', length: 6, nullable: true, name: 'decision_source' })
  decision_source: KycDecisionSource | null;

  @Column({ type: 'text', nullable: true, name: 'decision_reason' })
  decision_reason: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'consent_version' })
  consent_version: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'consent_accepted_at' })
  consent_accepted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'document_storage_consent_accepted_at' })
  document_storage_consent_accepted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'ocr_processing_consent_accepted_at' })
  ocr_processing_consent_accepted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'no_marketing_consent_accepted_at' })
  no_marketing_consent_accepted_at: Date | null;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'identity_verification_and_booking_safety',
    name: 'processing_purpose',
  })
  processing_purpose: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'retention_policy_version' })
  retention_policy_version: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'retention_expires_at' })
  retention_expires_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deleted_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  created_by: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updated_by: string | null;
}
