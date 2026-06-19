import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycDecisionMetadata1700000003000
  implements MigrationInterface
{
  name = 'AddKycDecisionMetadata1700000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "kyc_verifications"
        ADD COLUMN IF NOT EXISTS "decision_source" varchar(20) NULL,
        ADD COLUMN IF NOT EXISTS "decision_reason" text NULL
    `);
    await queryRunner.query(`
      UPDATE "kyc_verifications"
      SET "decision_source" = 'MANUAL'
      WHERE "decision_source" IS NULL
        AND "verification_status" IN ('VERIFIED', 'REJECTED')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "kyc_verifications"
        DROP COLUMN IF EXISTS "decision_reason",
        DROP COLUMN IF EXISTS "decision_source"
    `);
  }
}
