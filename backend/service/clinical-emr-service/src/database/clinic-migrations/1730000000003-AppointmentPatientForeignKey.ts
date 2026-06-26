import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentPatientForeignKey1730000000003
  implements MigrationInterface
{
  name = 'AppointmentPatientForeignKey1730000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const patientsTable = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'patients'
      ) AS exists
    `);

    if (!patientsTable?.[0]?.exists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD CONSTRAINT "appointments_patient_id_fkey"
        FOREIGN KEY ("patient_id")
        REFERENCES "patients"("patient_id")
        ON DELETE RESTRICT
        NOT VALID
    `);
    await queryRunner.query(`
      ALTER TABLE "appointments"
        VALIDATE CONSTRAINT "appointments_patient_id_fkey"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP CONSTRAINT IF EXISTS "appointments_patient_id_fkey"
    `);
  }
}
