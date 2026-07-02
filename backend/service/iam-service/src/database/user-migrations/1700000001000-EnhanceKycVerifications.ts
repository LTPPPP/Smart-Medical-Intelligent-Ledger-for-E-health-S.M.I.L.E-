import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceKycVerifications1700000001000 implements MigrationInterface {
  name = 'EnhanceKycVerifications1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "kyc_verifications"
      ADD COLUMN IF NOT EXISTS "document_hash" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "date_of_birth" DATE,
      ADD COLUMN IF NOT EXISTS "ocr_status" VARCHAR(30) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "ocr_confidence" INTEGER,
      ADD COLUMN IF NOT EXISTS "ocr_payload" JSONB,
      ADD COLUMN IF NOT EXISTS "ocr_attempts" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "ocr_last_error" TEXT,
      ADD COLUMN IF NOT EXISTS "ocr_processed_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
      ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "consent_version" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "consent_accepted_at" TIMESTAMP
    `);

    await queryRunner.query(`
      UPDATE "kyc_verifications"
      SET "verification_status" = UPPER("verification_status")
      WHERE "verification_status" IN ('pending', 'verified', 'rejected')
    `);

    await queryRunner.query(`
      UPDATE "kyc_verifications"
      SET "verification_status" = 'PENDING_REVIEW'
      WHERE "verification_status" = 'PENDING'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_kyc_created_at"
      ON "kyc_verifications"("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_kyc_created_at"`);
    await queryRunner.query(`
      ALTER TABLE "kyc_verifications"
      DROP COLUMN IF EXISTS "consent_accepted_at",
      DROP COLUMN IF EXISTS "consent_version",
      DROP COLUMN IF EXISTS "submitted_at",
      DROP COLUMN IF EXISTS "rejection_reason",
      DROP COLUMN IF EXISTS "date_of_birth",
      DROP COLUMN IF EXISTS "full_name",
      DROP COLUMN IF EXISTS "ocr_processed_at",
      DROP COLUMN IF EXISTS "ocr_last_error",
      DROP COLUMN IF EXISTS "ocr_attempts",
      DROP COLUMN IF EXISTS "ocr_payload",
      DROP COLUMN IF EXISTS "ocr_confidence",
      DROP COLUMN IF EXISTS "ocr_status"
    `);
  }
}
