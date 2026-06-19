import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentNoDoubleBooking1730000000000
  implements MigrationInterface
{
  name = 'AppointmentNoDoubleBooking1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD COLUMN IF NOT EXISTS "during" tsrange
        GENERATED ALWAYS AS (
          tsrange(
            ("appointment_date" + "appointment_time"),
            ("appointment_date" + "appointment_time"
              + (COALESCE("duration_minutes", 30) * INTERVAL '1 minute')),
            '[)'
          )
        ) STORED
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD CONSTRAINT "appt_no_double_booking"
        EXCLUDE USING gist (
          "doctor_id" WITH =,
          "during" WITH &&
        )
        WHERE ("status" <> 'cancelled' AND "status" <> 'no_show')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appt_no_double_booking"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN IF EXISTS "during"`,
    );
  }
}
