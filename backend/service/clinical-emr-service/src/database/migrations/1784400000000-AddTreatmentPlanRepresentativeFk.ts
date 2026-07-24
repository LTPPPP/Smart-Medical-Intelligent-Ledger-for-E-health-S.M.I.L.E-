import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * treatment_plans.accepted_representative_id pointed at
 * patient_representatives(representative_id) but carried no FK, so the pointer
 * could dangle. Both tables live in the medical DB, so a real FK is possible.
 *
 * The accepted_representative_* columns are a denormalized snapshot (name /
 * relationship / phone are kept alongside the id), so ON DELETE SET NULL is
 * used: if the representative row is removed, the human-readable snapshot
 * survives and only the dangling pointer is cleared.
 */
export class AddTreatmentPlanRepresentativeFk1784400000000
  implements MigrationInterface
{
  name = 'AddTreatmentPlanRepresentativeFk1784400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clear any pre-existing dangling pointers so the FK can be validated.
    await queryRunner.query(`
      UPDATE "treatment_plans"
      SET "accepted_representative_id" = NULL
      WHERE "accepted_representative_id" IS NOT NULL
        AND "accepted_representative_id" NOT IN (
          SELECT "representative_id" FROM "patient_representatives"
        )
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'fk_treatment_plans_accepted_representative'
        ) THEN
          ALTER TABLE "treatment_plans"
          ADD CONSTRAINT "fk_treatment_plans_accepted_representative"
          FOREIGN KEY ("accepted_representative_id")
          REFERENCES "patient_representatives"("representative_id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_treatment_plans_accepted_representative"
      ON "treatment_plans"("accepted_representative_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_treatment_plans_accepted_representative"`,
    );
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP CONSTRAINT IF EXISTS "fk_treatment_plans_accepted_representative"
    `);
  }
}
