import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentReminderTracking1730000000005
  implements MigrationInterface
{
  name = 'AppointmentReminderTracking1730000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointment_reminder_preferences" (
        "preference_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_id" UUID NOT NULL,
        "channel" VARCHAR(20) NOT NULL DEFAULT 'APP',
        "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
        "reminder_minutes_before" INT NOT NULL DEFAULT 1440,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "uq_reminder_preferences_patient_channel"
          UNIQUE ("patient_id", "channel")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointment_notification_logs" (
        "log_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "appointment_id" UUID NOT NULL REFERENCES "appointments"("appointment_id") ON DELETE CASCADE,
        "notification_type" VARCHAR(50) NOT NULL,
        "channel" VARCHAR(20) NOT NULL DEFAULT 'APP',
        "status" VARCHAR(20) NOT NULL,
        "attempt_count" INT NOT NULL DEFAULT 0,
        "notification_id" VARCHAR(100),
        "preference_enabled" BOOLEAN,
        "reminder_minutes_before" INT,
        "last_attempt_at" TIMESTAMP,
        "next_retry_at" TIMESTAMP,
        "error_message" TEXT,
        "read_at" TIMESTAMP,
        "responded_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_appointment_notification_logs_appointment"
      ON "appointment_notification_logs"("appointment_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_appointment_notification_logs_appointment"
    `);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "appointment_notification_logs"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "appointment_reminder_preferences"`,
    );
  }
}
