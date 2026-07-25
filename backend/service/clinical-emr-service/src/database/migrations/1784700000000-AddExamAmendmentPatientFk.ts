import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the missing exam_amendments_patient_fkey.
 *
 * database/clinical-emr-service/medical-service/schema.sql documents three
 * foreign keys on examination_session_amendments — session, record and patient —
 * but CreateExaminationSessionAmendments1783000000000 only created the first two.
 * The patient_id column has been unconstrained ever since, which made
 * examination_session_amendments the one table in this database with a local
 * parent it did not point at.
 *
 * patients lives in the same database, so unlike appointments.patient_id (which
 * crosses into core_clinic_service_db and cannot be enforced) this one is a real
 * enforceable key.
 *
 * ON DELETE SET NULL matches the record FK and schema.sql: an amendment is an
 * append-only clinical correction and must survive the patient row being removed.
 */
export class AddExamAmendmentPatientFk1784700000000
  implements MigrationInterface
{
  name = 'AddExamAmendmentPatientFk1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clear any value that would violate the new constraint before adding it.
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
