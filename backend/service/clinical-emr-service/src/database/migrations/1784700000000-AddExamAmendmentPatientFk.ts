import { MigrationInterface, QueryRunner } from 'typeorm';

// Add Amendment Patient Fk
export class AddExamAmendmentPatientFk1784700000000
  implements MigrationInterface
{
  name = 'AddExamAmendmentPatientFk1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clear Invalid Values
    await queryRunner.query(`
      UPDATE "examination_session_amendments" a
      SET "patient_id" = NULL
      WHERE a."patient_id" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "patients" p WHERE p."patient_id" = a."patient_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "examination_session_amendments"
        DROP CONSTRAINT IF EXISTS "exam_amendments_patient_fkey"
    `);
    await queryRunner.query(`
      ALTER TABLE "examination_session_amendments"
        ADD CONSTRAINT "exam_amendments_patient_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id")
        ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_amendments_patient"
        ON "examination_session_amendments"("patient_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_exam_amendments_patient"`,
    );
    await queryRunner.query(`
      ALTER TABLE "examination_session_amendments"
        DROP CONSTRAINT IF EXISTS "exam_amendments_patient_fkey"
    `);
  }
}
