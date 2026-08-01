import { MigrationInterface, QueryRunner } from 'typeorm';

const OCCUPIED_PREDICATE = `WHERE ("status" IN ('scheduled', 'confirmed', 'checked_in', 'in_progress'))`;

const OCCUPIED_EXCLUSIONS: { name: string; column: string }[] = [
  { name: 'appointments_doctor_occupied_excl', column: 'doctor_id' },
  { name: 'appointments_room_occupied_excl', column: 'room_id' },
  { name: 'appointments_patient_occupied_excl', column: 'patient_id' },
];

/**
 * Shrinks core_clinic_service_db columns to the exact length their value set
 * needs. Only columns pinned by a TS enum / DB CHECK, or with a fixed technical
 * length, are touched.
 *
 *   clinics.status                    20 -> 11  ClinicStatus, 'MAINTENANCE'
 *   treatment_rooms.status            20 -> 11  RoomStatus, 'MAINTENANCE'
 *   services.currency                 10 -> char(3)  ISO 4217 (CHECK-constrained)
 *   doctor_schedules.status           20 ->  9  ScheduleStatus, 'scheduled'
 *   doctor_leaves.leave_type          50 ->  9  LeaveType, 'emergency'
 *   doctor_leaves.status              20 ->  8  ApprovalStatus, 'approved'
 *   schedule_changes.change_type      50 -> 14  ChangeType, 'shift_transfer'
 *   schedule_changes.approval_status  20 ->  8  ApprovalStatus
 *   appointments.appointment_type     50 -> 12  AppointmentType, 'consultation'
 *   appointments.status               20 -> 11  AppointmentStatus, 'in_progress'
 *   appointments.payment_status       20 -> 14  PaymentStatus, 'partially_paid'
 *   appointment_status_history.old_status / new_status  20 -> 11  AppointmentStatus
 *   appointment_reminder_preferences.channel  20 -> 5  NotificationChannel, 'EMAIL'
 *   appointment_notification_logs.channel     20 -> 5  same
 *   diagnostic_orders.order_type      50 -> 13  OrderType, 'clinical_test'
 *   diagnostic_orders.priority        20 ->  7  OrderPriority, 'routine'
 *   diagnostic_orders.status          20 -> 11  OrderStatus, 'in_progress'
 *   idempotency_keys.method           10 ->  7  'OPTIONS'
 *   idempotency_keys.status           20 -> 11  'in_progress' | 'completed'
 *
 * appointments.status appears in the WHERE predicate of the three
 * EXCLUDE USING gist constraints that prevent double-booking. PostgreSQL cannot
 * rewrite a column that a constraint predicate depends on, so those three are
 * dropped and recreated verbatim around the ALTER. Everything else — including
 * idx_appointments_status and the generated occupied_during column, which reads
 * only the date/time/duration columns — is rebuilt by PostgreSQL automatically.
 *
 * Left alone on purpose: appointment_notification_logs.{notification_type,status}
 * and diagnostic_orders.{tooth_number,area} have no enum pinning their values.
 */
export class TightenColumnWidths1730000000008 implements MigrationInterface {
  name = 'TightenColumnWidths1730000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clinics" ALTER COLUMN "status" TYPE VARCHAR(11)`,
    );
    await queryRunner.query(
      `ALTER TABLE "treatment_rooms" ALTER COLUMN "status" TYPE VARCHAR(11)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ALTER COLUMN "currency" TYPE CHAR(3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" ALTER COLUMN "status" TYPE VARCHAR(9)`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_leaves" ALTER COLUMN "leave_type" TYPE VARCHAR(9)`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_leaves" ALTER COLUMN "status" TYPE VARCHAR(8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_changes" ALTER COLUMN "change_type" TYPE VARCHAR(14)`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_changes" ALTER COLUMN "approval_status" TYPE VARCHAR(8)`,
    );

    // Load-Bearing Status Column
    for (const { name } of OCCUPIED_EXCLUSIONS) {
      await queryRunner.query(
        `ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "${name}"`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "appointment_type" TYPE VARCHAR(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" TYPE VARCHAR(11)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "payment_status" TYPE VARCHAR(14)`,
    );

    for (const { name, column } of OCCUPIED_EXCLUSIONS) {
      await queryRunner.query(`
        ALTER TABLE "appointments"
          ADD CONSTRAINT "${name}"
          EXCLUDE USING gist (
            "${column}" WITH =,
            "occupied_during" WITH &&
          )
          ${OCCUPIED_PREDICATE}
      `);
    }

    await queryRunner.query(
      `ALTER TABLE "appointment_status_history" ALTER COLUMN "old_status" TYPE VARCHAR(11)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_status_history" ALTER COLUMN "new_status" TYPE VARCHAR(11)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_reminder_preferences" ALTER COLUMN "channel" TYPE VARCHAR(5)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_notification_logs" ALTER COLUMN "channel" TYPE VARCHAR(5)`,
    );

    await queryRunner.query(
      `ALTER TABLE "diagnostic_orders" ALTER COLUMN "order_type" TYPE VARCHAR(13)`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnostic_orders" ALTER COLUMN "priority" TYPE VARCHAR(7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnostic_orders" ALTER COLUMN "status" TYPE VARCHAR(11)`,
    );

    await queryRunner.query(
      `ALTER TABLE "idempotency_keys" ALTER COLUMN "method" TYPE VARCHAR(7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "idempotency_keys" ALTER COLUMN "status" TYPE VARCHAR(11)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "idempotency_keys" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "idempotency_keys" ALTER COLUMN "method" TYPE VARCHAR(10)`,
    );

    await queryRunner.query(
      `ALTER TABLE "diagnostic_orders" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnostic_orders" ALTER COLUMN "priority" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnostic_orders" ALTER COLUMN "order_type" TYPE VARCHAR(50)`,
    );

    await queryRunner.query(
      `ALTER TABLE "appointment_notification_logs" ALTER COLUMN "channel" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_reminder_preferences" ALTER COLUMN "channel" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_status_history" ALTER COLUMN "new_status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_status_history" ALTER COLUMN "old_status" TYPE VARCHAR(20)`,
    );

    for (const { name } of OCCUPIED_EXCLUSIONS) {
      await queryRunner.query(
        `ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "${name}"`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "payment_status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "appointment_type" TYPE VARCHAR(50)`,
    );

    for (const { name, column } of OCCUPIED_EXCLUSIONS) {
      await queryRunner.query(`
        ALTER TABLE "appointments"
          ADD CONSTRAINT "${name}"
          EXCLUDE USING gist (
            "${column}" WITH =,
            "occupied_during" WITH &&
          )
          ${OCCUPIED_PREDICATE}
      `);
    }

    await queryRunner.query(
      `ALTER TABLE "schedule_changes" ALTER COLUMN "approval_status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_changes" ALTER COLUMN "change_type" TYPE VARCHAR(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_leaves" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_leaves" ALTER COLUMN "leave_type" TYPE VARCHAR(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ALTER COLUMN "currency" TYPE VARCHAR(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "treatment_rooms" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinics" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
  }
}
