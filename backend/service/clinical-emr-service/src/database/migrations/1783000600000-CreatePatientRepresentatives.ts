import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatientRepresentatives1783000600000
  implements MigrationInterface
{
  name = 'CreatePatientRepresentatives1783000600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "patient_representatives" (
        "representative_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_id" UUID NOT NULL REFERENCES "patients"("patient_id") ON DELETE CASCADE,
        "full_name" VARCHAR(255) NOT NULL,
        "relationship" VARCHAR(100) NOT NULL,
        "phone" VARCHAR(20) NOT NULL,
        "email" VARCHAR(255),
        "legal_document_type" VARCHAR(50),
        "legal_document_number" VARCHAR(100),
        "is_primary" BOOLEAN NOT NULL DEFAULT FALSE,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "authorized_for_treatment" BOOLEAN NOT NULL DEFAULT FALSE,
        "authorized_for_payment" BOOLEAN NOT NULL DEFAULT FALSE,
        "authorized_for_records" BOOLEAN NOT NULL DEFAULT FALSE,
        "verified_at" TIMESTAMP,
        "verified_by" UUID,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_patient_representatives_patient"
      ON "patient_representatives"("patient_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_patient_representatives_authorized"
      ON "patient_representatives"("patient_id", "is_active", "is_primary")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_patient_representatives_authorized"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_patient_representatives_patient"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "patient_representatives"`);
  }
}
