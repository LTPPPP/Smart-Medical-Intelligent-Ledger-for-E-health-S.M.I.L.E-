import { MigrationInterface, QueryRunner } from 'typeorm';

export class CanonicalAppointmentAvailability1730000000002
  implements MigrationInterface
{
  name = 'CanonicalAppointmentAvailability1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinic_room_type') THEN
          CREATE TYPE clinic_room_type AS ENUM ('examination', 'surgery', 'imaging');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      UPDATE "treatment_rooms"
      SET "room_type" = CASE LOWER(COALESCE("room_type", ''))
        WHEN 'surgery' THEN 'surgery'
        WHEN 'imaging' THEN 'imaging'
        ELSE 'examination'
      END
    `);

    await queryRunner.query(`
      ALTER TABLE "services"
        ADD COLUMN IF NOT EXISTS "required_room_type" clinic_room_type
    `);

    await queryRunner.query(`
      UPDATE "services"
      SET "required_room_type" = CASE
        WHEN "service_code" IN (
          'ORAL-CHECK', 'KHAM-TQ', 'TU-VAN', 'CAO-VR',
          'TRAM-R', 'TAY-T', 'BOC-SU', 'NIENG-R', 'SMOKE-SVC'
        ) THEN 'examination'::clinic_room_type
        WHEN "service_code" IN ('NHO-R', 'IMPLANT') THEN 'surgery'::clinic_room_type
        WHEN "service_code" IN ('CHUP-XQ') THEN 'imaging'::clinic_room_type
        ELSE "required_room_type"
      END
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM "services" WHERE "required_room_type" IS NULL
        ) THEN
          RAISE EXCEPTION 'Every service must define required_room_type before scheduling is enabled';
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "services"
        ALTER COLUMN "required_room_type" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "treatment_rooms"
        ALTER COLUMN "room_type" TYPE clinic_room_type USING "room_type"::clinic_room_type,
        ALTER COLUMN "room_type" SET NOT NULL,
        DROP COLUMN IF EXISTS "capacity"
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP CONSTRAINT IF EXISTS "appt_no_double_booking"
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP COLUMN IF EXISTS "during"
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD COLUMN IF NOT EXISTS "occupied_during" tsrange
        GENERATED ALWAYS AS (
          tsrange(
            ("appointment_date" + "appointment_time"),
            ("appointment_date" + "appointment_time"
              + INTERVAL '25 minutes'
              + (COALESCE("duration_minutes", 30) * INTERVAL '1 minute')),
            '[)'
          )
        ) STORED
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD CONSTRAINT "appointments_doctor_occupied_excl"
        EXCLUDE USING gist (
          "doctor_id" WITH =,
          "occupied_during" WITH &&
        )
        WHERE ("status" IN ('scheduled', 'confirmed', 'checked_in', 'in_progress'))
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD CONSTRAINT "appointments_room_occupied_excl"
        EXCLUDE USING gist (
          "room_id" WITH =,
          "occupied_during" WITH &&
        )
        WHERE ("status" IN ('scheduled', 'confirmed', 'checked_in', 'in_progress'))
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD CONSTRAINT "appointments_patient_occupied_excl"
        EXCLUDE USING gist (
          "patient_id" WITH =,
          "occupied_during" WITH &&
        )
        WHERE ("status" IN ('scheduled', 'confirmed', 'checked_in', 'in_progress'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP CONSTRAINT IF EXISTS "appointments_patient_occupied_excl"
    `);
    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP CONSTRAINT IF EXISTS "appointments_room_occupied_excl"
    `);
    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP CONSTRAINT IF EXISTS "appointments_doctor_occupied_excl"
    `);
    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP COLUMN IF EXISTS "occupied_during"
    `);
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
    await queryRunner.query(`
      ALTER TABLE "treatment_rooms"
        ADD COLUMN IF NOT EXISTS "capacity" INT,
        ALTER COLUMN "room_type" TYPE VARCHAR(50) USING "room_type"::text,
        ALTER COLUMN "room_type" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "services"
        DROP COLUMN IF EXISTS "required_room_type"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS clinic_room_type`);
  }
}
