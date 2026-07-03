import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExaminationSessionAmendments1783000000000
  implements MigrationInterface
{
  name = 'CreateExaminationSessionAmendments1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "examination_session_amendments" (
        "amendment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL,
        "record_id" uuid,
        "patient_id" uuid,
        "doctor_id" uuid NOT NULL,
        "amendment_reason" text NOT NULL,
        "amendment_text" text NOT NULL,
        "amended_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "exam_amendments_session_fkey"
          FOREIGN KEY ("session_id")
          REFERENCES "examination_sessions"("session_id")
          ON DELETE CASCADE,
        CONSTRAINT "exam_amendments_record_fkey"
          FOREIGN KEY ("record_id")
          REFERENCES "medical_records"("record_id")
          ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_amendments_session"
        ON "examination_session_amendments" ("session_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_amendments_record"
        ON "examination_session_amendments" ("record_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_amendments_record"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_amendments_session"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "examination_session_amendments"
    `);
  }
}
