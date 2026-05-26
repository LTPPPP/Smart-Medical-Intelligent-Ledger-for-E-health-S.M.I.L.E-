import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgentSchedulingTables1760000000000
  implements MigrationInterface
{
  name = 'CreateAgentSchedulingTables1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "slots" (
        "slot_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clinic_id" UUID NOT NULL REFERENCES "clinics"("clinic_id") ON DELETE CASCADE,
        "doctor_id" UUID,
        "room_id" UUID REFERENCES "treatment_rooms"("room_id"),
        "service_id" UUID REFERENCES "services"("service_id"),
        "slot_date" DATE NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "duration_minutes" INT DEFAULT 30,
        "status" VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
        "held_by_session_id" VARCHAR(255),
        "hold_expires_at" TIMESTAMP,
        "appointment_id" UUID REFERENCES "appointments"("appointment_id"),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_slots_clinic_date_start"
      ON "slots" ("clinic_id", "slot_date", "start_time")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_slots_doctor_date_start"
      ON "slots" ("doctor_id", "slot_date", "start_time")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "slot_holds" (
        "hold_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "slot_id" UUID NOT NULL REFERENCES "slots"("slot_id") ON DELETE CASCADE,
        "patient_session_id" VARCHAR(255) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "expires_at" TIMESTAMP NOT NULL,
        "confirmed_at" TIMESTAMP,
        "released_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_slot_holds_slot_status"
      ON "slot_holds" ("slot_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_slot_holds_session_status"
      ON "slot_holds" ("patient_session_id", "status")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "waitlist_entries" (
        "waitlist_entry_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_id" UUID,
        "patient_name" VARCHAR(255) NOT NULL,
        "patient_phone" VARCHAR(20) NOT NULL,
        "patient_email" VARCHAR(255),
        "clinic_id" UUID NOT NULL REFERENCES "clinics"("clinic_id") ON DELETE CASCADE,
        "service_id" UUID NOT NULL REFERENCES "services"("service_id"),
        "doctor_id" UUID,
        "preferred_date" DATE NOT NULL,
        "preferred_start_time" TIME,
        "preferred_end_time" TIME,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_waitlist_match"
      ON "waitlist_entries" ("clinic_id", "service_id", "preferred_date", "status")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_outbox" (
        "email_outbox_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "notification_type" VARCHAR(80) NOT NULL,
        "recipient_type" VARCHAR(40) NOT NULL,
        "recipient_email" VARCHAR(255) NOT NULL,
        "subject" VARCHAR(255) NOT NULL,
        "body" TEXT NOT NULL,
        "template_data" JSONB,
        "status" VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
        "last_error" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "handoff_tickets" (
        "handoff_ticket_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" VARCHAR(255) NOT NULL,
        "patient_id" UUID,
        "risk_level" VARCHAR(20) NOT NULL,
        "source_message" TEXT NOT NULL,
        "summary" TEXT NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "handoff_tickets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "email_outbox"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waitlist_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "slot_holds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "slots"`);
  }
}
