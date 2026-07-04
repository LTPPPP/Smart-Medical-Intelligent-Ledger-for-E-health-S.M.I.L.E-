import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRepresentativeConsentSnapshots1783000700000
  implements MigrationInterface
{
  name = 'AddRepresentativeConsentSnapshots1783000700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "representative_id_snapshot" UUID
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "representative_relationship_snapshot" VARCHAR(100)
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "accepted_representative_id" UUID
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "accepted_representative_name" VARCHAR(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "accepted_representative_relationship" VARCHAR(100)
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      ADD COLUMN IF NOT EXISTS "accepted_representative_phone" VARCHAR(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "accepted_representative_phone"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "accepted_representative_relationship"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "accepted_representative_name"
    `);
    await queryRunner.query(`
      ALTER TABLE "treatment_plans"
      DROP COLUMN IF EXISTS "accepted_representative_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "representative_relationship_snapshot"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "representative_id_snapshot"
    `);
  }
}
