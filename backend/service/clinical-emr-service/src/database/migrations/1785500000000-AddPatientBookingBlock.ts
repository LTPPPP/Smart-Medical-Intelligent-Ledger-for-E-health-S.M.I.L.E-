import { MigrationInterface, QueryRunner } from 'typeorm';

// Add Booking Block
export class AddPatientBookingBlock1785500000000 implements MigrationInterface {
  name = 'AddPatientBookingBlock1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
        ADD COLUMN IF NOT EXISTS "booking_blocked" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "booking_blocked_reason" text,
        ADD COLUMN IF NOT EXISTS "booking_blocked_at" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
        DROP COLUMN IF EXISTS "booking_blocked_at",
        DROP COLUMN IF EXISTS "booking_blocked_reason",
        DROP COLUMN IF EXISTS "booking_blocked"
    `);
  }
}
