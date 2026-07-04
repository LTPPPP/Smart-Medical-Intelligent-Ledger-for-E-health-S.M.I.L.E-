import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * appointments.patient_id references patients.patient_id, but the patients
 * table lives in core_medical_service_db while appointments lives in
 * core_clinic_service_db. PostgreSQL cannot enforce a foreign key across
 * databases, so the constraint (added by the removed migration
 * 1730000000003-AppointmentPatientForeignKey) only ever worked when both
 * logical databases were collapsed into one. Referential integrity is
 * enforced at the application layer instead
 * (AppointmentsService.resolveBookingPatientId -> PatientsService.findOne).
 */
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
    // Intentionally left empty: the cross-database foreign key cannot be
    // recreated on a database-per-service deployment.
  }
}
