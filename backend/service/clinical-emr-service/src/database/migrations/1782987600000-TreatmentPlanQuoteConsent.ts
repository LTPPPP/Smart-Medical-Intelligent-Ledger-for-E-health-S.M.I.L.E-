import { MigrationInterface, QueryRunner } from 'typeorm';

export class TreatmentPlanQuoteConsent1782987600000
  implements MigrationInterface
{
  name = 'TreatmentPlanQuoteConsent1782987600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "session_id" UUID
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "estimated_cost" DECIMAL(12,2)
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "quote_currency" VARCHAR(3)
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "proposed_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "accepted_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "accepted_by" UUID
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "declined_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "declined_by" UUID
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "decline_reason" TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ALTER COLUMN "status" SET DEFAULT 'draft'
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_treatment_plans_session'
        ) THEN
          ALTER TABLE "treatment_plans"
          ADD CONSTRAINT "fk_treatment_plans_session"
          FOREIGN KEY ("session_id")
          REFERENCES "examination_sessions"("session_id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_treatment_plans_session"
      ON "treatment_plans"("session_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_treatment_plans_session"`);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP CONSTRAINT IF EXISTS "fk_treatment_plans_session"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ALTER COLUMN "status" SET DEFAULT 'active'
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "decline_reason"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "declined_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "declined_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "accepted_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "accepted_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "proposed_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "quote_currency"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "estimated_cost"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "session_id"
    `);
  }
}
