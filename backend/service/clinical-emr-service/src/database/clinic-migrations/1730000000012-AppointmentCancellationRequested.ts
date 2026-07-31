import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Keeps the appointment cancellation workflow in sync with AppointmentEntity.
 *
 * The field is intentionally nullable-free so existing appointments behave as
 * ordinary appointments (no pending cancellation request) after upgrading.
 */
export class AppointmentCancellationRequested1730000000012
  implements MigrationInterface
{
  name = 'AppointmentCancellationRequested1730000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD COLUMN IF NOT EXISTS "cancellation_requested" BOOLEAN NOT NULL DEFAULT FALSE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP COLUMN IF EXISTS "cancellation_requested"
    `);
  }
}
