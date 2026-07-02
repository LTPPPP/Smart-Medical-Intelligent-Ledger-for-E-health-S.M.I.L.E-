import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentFollowUpLinks1730000000004
  implements MigrationInterface
{
  name = 'AppointmentFollowUpLinks1730000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD COLUMN IF NOT EXISTS "session_id" uuid,
        ADD COLUMN IF NOT EXISTS "treatment_plan_id" uuid
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_appointments_session_id"
        ON "appointments" ("session_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_appointments_treatment_plan_id"
        ON "appointments" ("treatment_plan_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_appointments_treatment_plan_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_appointments_session_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP COLUMN IF EXISTS "treatment_plan_id",
        DROP COLUMN IF EXISTS "session_id"
    `);
  }
}
