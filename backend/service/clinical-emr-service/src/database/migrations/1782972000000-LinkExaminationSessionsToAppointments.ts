import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkExaminationSessionsToAppointments1782972000000
  implements MigrationInterface
{
  name = 'LinkExaminationSessionsToAppointments1782972000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "examination_sessions"
      ADD COLUMN IF NOT EXISTS "appointment_id" UUID
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_sessions_appointment"
      ON "examination_sessions"("appointment_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_exam_sessions_appointment"`,
    );
    await queryRunner.query(`
      ALTER TABLE "examination_sessions"
      DROP COLUMN IF EXISTS "appointment_id"
    `);
  }
}
