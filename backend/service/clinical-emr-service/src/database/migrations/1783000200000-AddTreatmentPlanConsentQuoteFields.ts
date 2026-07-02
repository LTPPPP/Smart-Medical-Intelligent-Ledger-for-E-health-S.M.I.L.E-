import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTreatmentPlanConsentQuoteFields1783000200000
  implements MigrationInterface
{
  name = 'AddTreatmentPlanConsentQuoteFields1783000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
        ADD COLUMN IF NOT EXISTS "quote_version" varchar(100),
        ADD COLUMN IF NOT EXISTS "risk_disclosure" text,
        ADD COLUMN IF NOT EXISTS "alternative_options" text,
        ADD COLUMN IF NOT EXISTS "acceptance_scope" varchar(20),
        ADD COLUMN IF NOT EXISTS "accepted_scope_note" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
        DROP COLUMN IF EXISTS "accepted_scope_note",
        DROP COLUMN IF EXISTS "acceptance_scope",
        DROP COLUMN IF EXISTS "alternative_options",
        DROP COLUMN IF EXISTS "risk_disclosure",
        DROP COLUMN IF EXISTS "quote_version"
    `);
  }
}
