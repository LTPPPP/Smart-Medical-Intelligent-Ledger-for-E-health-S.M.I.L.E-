import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenKycPrivacy1700000002000 implements MigrationInterface {
  name = 'HardenKycPrivacy1700000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE kyc_verifications
        ADD COLUMN IF NOT EXISTS document_storage_consent_accepted_at timestamp NULL,
        ADD COLUMN IF NOT EXISTS ocr_processing_consent_accepted_at timestamp NULL,
        ADD COLUMN IF NOT EXISTS no_marketing_consent_accepted_at timestamp NULL,
        ADD COLUMN IF NOT EXISTS processing_purpose varchar(100) NOT NULL DEFAULT 'identity_verification_and_booking_safety',
        ADD COLUMN IF NOT EXISTS retention_policy_version varchar(50) NULL,
        ADD COLUMN IF NOT EXISTS retention_expires_at timestamp NULL,
        ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE kyc_verifications
        DROP COLUMN IF EXISTS deleted_at,
        DROP COLUMN IF EXISTS retention_expires_at,
        DROP COLUMN IF EXISTS retention_policy_version,
        DROP COLUMN IF EXISTS processing_purpose,
        DROP COLUMN IF EXISTS no_marketing_consent_accepted_at,
        DROP COLUMN IF EXISTS ocr_processing_consent_accepted_at,
        DROP COLUMN IF EXISTS document_storage_consent_accepted_at
    `);
  }
}
