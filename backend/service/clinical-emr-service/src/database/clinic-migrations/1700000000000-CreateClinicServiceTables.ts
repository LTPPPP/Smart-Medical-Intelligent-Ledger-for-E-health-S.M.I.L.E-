import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicServiceTables1700000000000
  implements MigrationInterface
{
  name = 'CreateClinicServiceTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── CLINIC MODULE ───

    // Clinics table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinics" (
        "clinic_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clinic_name" VARCHAR(255) NOT NULL,
        "clinic_code" VARCHAR(50) UNIQUE NOT NULL,
        "address" TEXT NOT NULL,
        "ward" VARCHAR(100),
        "district" VARCHAR(100),
        "city" VARCHAR(100),
        "phone" VARCHAR(20),
        "email" VARCHAR(255),
        "website" VARCHAR(255),
        "logo_url" TEXT,
        "operating_hours" JSONB,
        "status" VARCHAR(20) DEFAULT 'ACTIVE',
        "license_number" VARCHAR(100),
        "license_expiry" DATE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Treatment Rooms table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "treatment_rooms" (
        "room_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clinic_id" UUID REFERENCES "clinics"("clinic_id") ON DELETE CASCADE,
        "room_name" VARCHAR(100) NOT NULL,
        "room_code" VARCHAR(50) NOT NULL,
        "room_type" VARCHAR(50),
        "floor_number" INT,
        "capacity" INT,
        "equipment_list" JSONB,
        "status" VARCHAR(20) DEFAULT 'AVAILABLE',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("clinic_id", "room_code")
      )
    `);

    // ─── SPECIALTY MODULE ───

    // Specialties table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "specialties" (
        "specialty_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "specialty_name" VARCHAR(255) NOT NULL,
        "specialty_code" VARCHAR(50) UNIQUE NOT NULL,
        "description" TEXT,
        "icon_url" TEXT,
        "is_active" BOOLEAN DEFAULT TRUE,
        "display_order" INT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Service Categories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_categories" (
        "category_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "category_name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "parent_category_id" UUID REFERENCES "service_categories"("category_id"),
        "is_active" BOOLEAN DEFAULT TRUE,
        "display_order" INT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Services table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "services" (
        "service_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "service_code" VARCHAR(50) UNIQUE NOT NULL,
        "service_name" VARCHAR(255) NOT NULL,
        "category_id" UUID REFERENCES "service_categories"("category_id"),
        "specialty_id" UUID REFERENCES "specialties"("specialty_id"),
        "description" TEXT,
        "duration_minutes" INT DEFAULT 30,
        "base_price" DECIMAL(10,2),
        "currency" VARCHAR(10) DEFAULT 'VND',
        "is_active" BOOLEAN DEFAULT TRUE,
        "requires_appointment" BOOLEAN DEFAULT TRUE,
        "preparation_instructions" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clinic Services table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinic_services" (
        "clinic_service_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clinic_id" UUID REFERENCES "clinics"("clinic_id") ON DELETE CASCADE,
        "service_id" UUID REFERENCES "services"("service_id") ON DELETE CASCADE,
        "custom_price" DECIMAL(10,2),
        "is_available" BOOLEAN DEFAULT TRUE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("clinic_id", "service_id")
      )
    `);

    // Doctor Specialties table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "doctor_specialties" (
        "doctor_id" UUID NOT NULL,
        "specialty_id" UUID REFERENCES "specialties"("specialty_id") ON DELETE CASCADE,
        "certification_number" VARCHAR(100),
        "certified_date" DATE,
        "is_primary" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("doctor_id", "specialty_id")
      )
    `);

    // ─── SCHEDULE MODULE ───

    // Work Shifts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "work_shifts" (
        "shift_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "shift_name" VARCHAR(100) NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Doctor Schedules table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "doctor_schedules" (
        "schedule_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "doctor_id" UUID NOT NULL,
        "clinic_id" UUID REFERENCES "clinics"("clinic_id") ON DELETE CASCADE,
        "shift_id" UUID REFERENCES "work_shifts"("shift_id"),
        "work_date" DATE NOT NULL,
        "room_id" UUID REFERENCES "treatment_rooms"("room_id"),
        "max_patients" INT DEFAULT 20,
        "status" VARCHAR(20) DEFAULT 'scheduled',
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("doctor_id", "work_date", "shift_id")
      )
    `);

    // Schedule Changes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "schedule_changes" (
        "change_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "schedule_id" UUID REFERENCES "doctor_schedules"("schedule_id") ON DELETE CASCADE,
        "changed_by" UUID NOT NULL,
        "change_type" VARCHAR(50) NOT NULL,
        "old_values" JSONB,
        "new_values" JSONB,
        "reason" TEXT,
        "approved_by" UUID,
        "approval_status" VARCHAR(20) DEFAULT 'pending',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Doctor Leaves table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "doctor_leaves" (
        "leave_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "doctor_id" UUID NOT NULL,
        "leave_type" VARCHAR(50),
        "start_date" DATE NOT NULL,
        "end_date" DATE NOT NULL,
        "reason" TEXT,
        "status" VARCHAR(20) DEFAULT 'pending',
        "approved_by" UUID,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ─── APPOINTMENT MODULE ───

    // Appointments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointments" (
        "appointment_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "appointment_code" VARCHAR(50) UNIQUE NOT NULL,
        "patient_id" UUID NOT NULL,
        "doctor_id" UUID NOT NULL,
        "clinic_id" UUID REFERENCES "clinics"("clinic_id") ON DELETE CASCADE,
        "room_id" UUID REFERENCES "treatment_rooms"("room_id"),
        "service_id" UUID REFERENCES "services"("service_id"),
        "appointment_date" DATE NOT NULL,
        "appointment_time" TIME NOT NULL,
        "duration_minutes" INT DEFAULT 30,
        "appointment_type" VARCHAR(50),
        "status" VARCHAR(20) DEFAULT 'scheduled',
        "chief_complaint" TEXT,
        "notes" TEXT,
        "cancellation_reason" TEXT,
        "cancelled_by" UUID,
        "cancelled_at" TIMESTAMP,
        "is_outside_hours" BOOLEAN DEFAULT FALSE,
        "outside_hours_reason" TEXT,
        "approved_by" UUID,
        "payment_id" UUID,
        "payment_status" VARCHAR(20) DEFAULT 'unpaid',
        "created_by" UUID NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Appointment Status History table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointment_status_history" (
        "history_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "appointment_id" UUID REFERENCES "appointments"("appointment_id") ON DELETE CASCADE,
        "old_status" VARCHAR(20),
        "new_status" VARCHAR(20),
        "changed_by" UUID NOT NULL,
        "reason" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Diagnostic Orders table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "diagnostic_orders" (
        "order_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "appointment_id" UUID REFERENCES "appointments"("appointment_id") ON DELETE CASCADE,
        "patient_id" UUID NOT NULL,
        "doctor_id" UUID NOT NULL,
        "order_code" VARCHAR(50) UNIQUE NOT NULL,
        "order_type" VARCHAR(50) NOT NULL,
        "description" TEXT,
        "priority" VARCHAR(20) DEFAULT 'routine',
        "tooth_number" VARCHAR(10),
        "area" VARCHAR(100),
        "status" VARCHAR(20) DEFAULT 'ordered',
        "result_summary" TEXT,
        "result_attachment_url" TEXT,
        "notes" TEXT,
        "ordered_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ─── INDEXES ───
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_clinics_code" ON "clinics"("clinic_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_rooms_clinic" ON "treatment_rooms"("clinic_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_doctor_specialties_doctor" ON "doctor_specialties"("doctor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_schedules_doctor_date" ON "doctor_schedules"("doctor_id", "work_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_schedules_clinic_date" ON "doctor_schedules"("clinic_id", "work_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_appointments_patient" ON "appointments"("patient_id", "appointment_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_appointments_doctor" ON "appointments"("doctor_id", "appointment_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_appointments_status" ON "appointments"("status", "appointment_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_appointment_history_id" ON "appointment_status_history"("appointment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_diagnostic_orders_appointment" ON "diagnostic_orders"("appointment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_diagnostic_orders_code" ON "diagnostic_orders"("order_code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_diagnostic_orders_code"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_diagnostic_orders_appointment"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_appointment_history_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointments_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointments_doctor"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointments_patient"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_schedules_clinic_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_schedules_doctor_date"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_doctor_specialties_doctor"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_rooms_clinic"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_clinics_code"`);
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "diagnostic_orders"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "appointment_status_history"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "doctor_leaves"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "schedule_changes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "doctor_schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_shifts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "doctor_specialties"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinic_services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "specialties"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treatment_rooms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinics"`);
  }
}
