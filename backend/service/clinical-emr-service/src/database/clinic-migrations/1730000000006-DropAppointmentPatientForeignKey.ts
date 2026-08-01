import { MigrationInterface, QueryRunner } from 'typeorm';

// Drop Cross-Db Fk
export class DropAppointmentPatientForeignKey1730000000006
  implements MigrationInterface
{
  name = 'DropAppointmentPatientForeignKey1730000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP CONSTRAINT IF EXISTS "appointments_patient_id_fkey"
    `);
  }

  public async down(): Promise<void> {
    // No-Op Down
  }
}
