import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a scheduled_for window column so the automatic reminder scheduler can
 * dedupe sends: one row per (appointment, channel, appointment start time).
 * Manual reminder sends leave scheduled_for NULL and stay outside the index.
 */
export class ReminderSchedulerDedupe1730000000010
  implements MigrationInterface
{
  name = 'ReminderSchedulerDedupe1730000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointment_notification_logs"
        ADD COLUMN IF NOT EXISTS "scheduled_for" TIMESTAMP
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_reminder_logs_dedupe"
        ON "appointment_notification_logs"("appointment_id", "channel", "scheduled_for")
        WHERE "notification_type" = 'APPOINTMENT_REMINDER' AND "scheduled_for" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_reminder_logs_dedupe"`);
    await queryRunner.query(`
      ALTER TABLE "appointment_notification_logs"
        DROP COLUMN IF EXISTS "scheduled_for"
    `);
  }
}
