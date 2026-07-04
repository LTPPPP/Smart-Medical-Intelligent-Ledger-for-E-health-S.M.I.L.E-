import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPediatricPrescriptionSnapshot1783000400000
  implements MigrationInterface
{
  name = 'AddPediatricPrescriptionSnapshot1783000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "minor_patient_at_issue" BOOLEAN
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "patient_age_years_at_issue" INT
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "patient_age_months_at_issue" INT
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "representative_name_snapshot" VARCHAR(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "representative_phone_snapshot" VARCHAR(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "representative_phone_snapshot"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "representative_name_snapshot"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "patient_age_months_at_issue"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "patient_age_years_at_issue"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "minor_patient_at_issue"
    `);
  }
}
