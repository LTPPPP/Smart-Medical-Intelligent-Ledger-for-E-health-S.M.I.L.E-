import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CreateClinicServiceTables1700000000000 created many columns with a DEFAULT
 * but without NOT NULL, while every entity declares them as non-nullable
 * (plain @Column with a default, or @CreateDateColumn/@UpdateDateColumn).
 * This migration backfills NULLs with the column default and adds the
 * constraint, so the DB finally matches the entities.
 *
 * Deliberately NOT touched: the nullable FK columns with drift NOTEs in
 * schema.sql (treatment_rooms.clinic_id, appointments.clinic_id, ...) —
 * those cannot be backfilled mechanically.
 */
export class SetNotNullOnDefaultedColumns1730000000009
  implements MigrationInterface
{
  name = 'SetNotNullOnDefaultedColumns1730000000009';

  private readonly columns: Array<[table: string, column: string]> = [
    ['clinics', 'status'],
    ['clinics', 'created_at'],
    ['clinics', 'updated_at'],
    ['treatment_rooms', 'status'],
    ['treatment_rooms', 'created_at'],
    ['treatment_rooms', 'updated_at'],
    ['specialties', 'is_active'],
    ['specialties', 'created_at'],
    ['specialties', 'updated_at'],
    ['doctor_specialties', 'is_primary'],
    ['doctor_specialties', 'created_at'],
    ['work_shifts', 'created_at'],
    ['service_categories', 'is_active'],
    ['service_categories', 'created_at'],
    ['services', 'duration_minutes'],
    ['services', 'currency'],
    ['services', 'is_active'],
    ['services', 'requires_appointment'],
    ['services', 'created_at'],
    ['services', 'updated_at'],
    ['clinic_services', 'is_available'],
    ['clinic_services', 'created_at'],
    ['clinic_services', 'updated_at'],
    ['doctor_schedules', 'max_patients'],
    ['doctor_schedules', 'status'],
    ['doctor_schedules', 'created_at'],
    ['doctor_schedules', 'updated_at'],
    ['doctor_leaves', 'status'],
    ['doctor_leaves', 'created_at'],
    ['doctor_leaves', 'updated_at'],
    ['schedule_changes', 'approval_status'],
    ['schedule_changes', 'created_at'],
    // Backfilling appointments.status to 'scheduled' can trip the EXCLUDE
    // overlap guards if NULL-status rows overlap active ones; the migration
    // then fails loudly instead of silently double-booking.
    ['appointments', 'duration_minutes'],
    ['appointments', 'status'],
    ['appointments', 'is_outside_hours'],
    ['appointments', 'payment_status'],
    ['appointments', 'created_at'],
    ['appointments', 'updated_at'],
    ['appointment_status_history', 'created_at'],
    ['diagnostic_orders', 'created_at'],
    ['diagnostic_orders', 'updated_at'],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of this.columns) {
      await queryRunner.query(
        `UPDATE "${table}" SET "${column}" = DEFAULT WHERE "${column}" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET NOT NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of [...this.columns].reverse()) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP NOT NULL`,
      );
    }
  }
}
