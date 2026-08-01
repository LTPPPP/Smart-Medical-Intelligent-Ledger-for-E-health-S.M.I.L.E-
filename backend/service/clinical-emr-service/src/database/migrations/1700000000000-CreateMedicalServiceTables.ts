import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMedicalServiceTables1700000000000
  implements MigrationInterface
{
  name = 'CreateMedicalServiceTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Patients Table
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "patient_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID,
        "patient_code" VARCHAR(50) UNIQUE NOT NULL,
        "full_name" VARCHAR(255) NOT NULL,
        "date_of_birth" DATE,
        "gender" VARCHAR(10),
        "phone" VARCHAR(20),
        "email" VARCHAR(255),
        "address" TEXT,
        "ward" VARCHAR(100),
        "district" VARCHAR(100),
        "city" VARCHAR(100),
        "emergency_contact" VARCHAR(255),
        "emergency_phone" VARCHAR(20),
        "blood_type" VARCHAR(10),
        "allergies" TEXT[],
        "chronic_diseases" TEXT[],
        "insurance_number" VARCHAR(100),
        "insurance_provider" VARCHAR(255),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Medical History Table
    await queryRunner.query(`
      CREATE TABLE "medical_history" (
        "history_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_id" UUID REFERENCES "patients"("patient_id") ON DELETE CASCADE,
        "condition_name" VARCHAR(255) NOT NULL,
        "condition_type" VARCHAR(50),
        "diagnosed_date" DATE,
        "treatment" TEXT,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Medical Records Table
    await queryRunner.query(`
      CREATE TABLE "medical_records" (
        "record_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_id" UUID REFERENCES "patients"("patient_id") ON DELETE CASCADE,
        "appointment_id" UUID,
        "clinic_id" UUID NOT NULL,
        "doctor_id" UUID NOT NULL,
        "visit_date" DATE NOT NULL,
        "chief_complaint" TEXT,
        "diagnosis" TEXT,
        "treatment_plan" TEXT,
        "notes" TEXT,
        "record_status" VARCHAR(20) DEFAULT 'draft',
        "record_hash" VARCHAR(255),
        "finalized_at" TIMESTAMP,
        "finalized_by" UUID,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Medical Record Versions
    await queryRunner.query(`
      CREATE TABLE "medical_record_versions" (
        "version_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "record_id" UUID REFERENCES "medical_records"("record_id") ON DELETE CASCADE,
        "version_number" INT NOT NULL,
        "snapshot" JSONB NOT NULL,
        "changed_by" UUID NOT NULL,
        "change_reason" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Record Exports
    await queryRunner.query(`
      CREATE TABLE "record_exports" (
        "export_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_id" UUID REFERENCES "patients"("patient_id") ON DELETE CASCADE,
        "record_id" UUID REFERENCES "medical_records"("record_id") ON DELETE CASCADE,
        "export_type" VARCHAR(50),
        "export_format" VARCHAR(20),
        "file_url" TEXT,
        "exported_by" UUID NOT NULL,
        "expires_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Dental Charts
    await queryRunner.query(`
      CREATE TABLE "dental_charts" (
        "chart_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_id" UUID REFERENCES "patients"("patient_id") ON DELETE CASCADE,
        "record_id" UUID REFERENCES "medical_records"("record_id") ON DELETE CASCADE,
        "tooth_number" INT NOT NULL,
        "tooth_status" VARCHAR(50),
        "surfaces" JSONB,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("record_id", "tooth_number")
      )
    `);

    // Examination Sessions
    await queryRunner.query(`
      CREATE TABLE "examination_sessions" (
        "session_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "appointment_id" UUID,
        "record_id" UUID REFERENCES "medical_records"("record_id") ON DELETE CASCADE,
        "patient_id" UUID REFERENCES "patients"("patient_id"),
        "doctor_id" UUID NOT NULL,
        "clinic_id" UUID NOT NULL,
        "session_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "chief_complaint" TEXT,
        "present_illness" TEXT,
        "physical_examination" TEXT,
        "vital_signs" JSONB,
          "status" VARCHAR(20) DEFAULT 'in_progress',
          "started_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "completed_at" TIMESTAMP,
          "signed_at" TIMESTAMP,
          "signed_by" UUID,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

    // Symptoms
    await queryRunner.query(`
      CREATE TABLE "symptoms" (
        "symptom_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" UUID REFERENCES "examination_sessions"("session_id") ON DELETE CASCADE,
        "patient_id" UUID REFERENCES "patients"("patient_id"),
        "symptom_name" VARCHAR(255) NOT NULL,
        "body_location" VARCHAR(100),
        "severity" VARCHAR(20),
        "onset_date" DATE,
        "duration" VARCHAR(100),
        "description" TEXT,
        "recorded_by" UUID NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Diagnoses
    await queryRunner.query(`
      CREATE TABLE "diagnoses" (
        "diagnosis_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" UUID REFERENCES "examination_sessions"("session_id") ON DELETE CASCADE,
        "icd_code" VARCHAR(20),
        "diagnosis_name" VARCHAR(255) NOT NULL,
        "diagnosis_type" VARCHAR(50),
        "severity" VARCHAR(20),
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Treatment Plans
    await queryRunner.query(`
      CREATE TABLE "treatment_plans" (
        "plan_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" UUID REFERENCES "examination_sessions"("session_id") ON DELETE CASCADE,
        "patient_id" UUID REFERENCES "patients"("patient_id") ON DELETE CASCADE,
        "record_id" UUID REFERENCES "medical_records"("record_id"),
        "plan_name" VARCHAR(255),
        "objectives" TEXT,
        "duration_weeks" INT,
        "status" VARCHAR(20) DEFAULT 'draft',
        "estimated_cost" DECIMAL(12,2),
        "quote_currency" VARCHAR(3),
        "sent_at" TIMESTAMP,
        "sent_to" UUID,
        "sent_via" VARCHAR(20),
        "confirmed_at" TIMESTAMP,
        "proposed_at" TIMESTAMP,
        "accepted_at" TIMESTAMP,
        "accepted_by" UUID,
        "declined_at" TIMESTAMP,
        "declined_by" UUID,
        "decline_reason" TEXT,
        "created_by" UUID NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Treatment History
    await queryRunner.query(`
      CREATE TABLE "treatment_history" (
        "treatment_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "record_id" UUID REFERENCES "medical_records"("record_id") ON DELETE CASCADE,
        "patient_id" UUID REFERENCES "patients"("patient_id") ON DELETE CASCADE,
        "treatment_date" DATE NOT NULL,
        "tooth_numbers" INT[],
        "procedure_code" VARCHAR(50),
        "procedure_name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "cost" DECIMAL(10,2),
        "status" VARCHAR(20) DEFAULT 'completed',
        "performed_by" UUID NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Prescriptions
    await queryRunner.query(`
      CREATE TABLE "prescriptions" (
        "prescription_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" UUID REFERENCES "examination_sessions"("session_id") ON DELETE CASCADE,
        "record_id" UUID REFERENCES "medical_records"("record_id") ON DELETE CASCADE,
        "patient_id" UUID NOT NULL REFERENCES "patients"("patient_id"),
        "doctor_id" UUID NOT NULL,
        "prescription_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "status" VARCHAR(20) DEFAULT 'draft',
        "notes" TEXT,
        "digital_signature_id" UUID,
        "issued_at" TIMESTAMP,
        "issued_by" UUID,
        "cancelled_at" TIMESTAMP,
        "cancellation_reason" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Prescription Items
    await queryRunner.query(`
      CREATE TABLE "prescription_items" (
        "item_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "prescription_id" UUID REFERENCES "prescriptions"("prescription_id") ON DELETE CASCADE,
        "medication_name" VARCHAR(255) NOT NULL,
        "medication_code" VARCHAR(50),
        "dosage" VARCHAR(100) NOT NULL,
        "route" VARCHAR(50),
        "frequency" VARCHAR(100) NOT NULL,
        "duration_days" INT,
        "quantity" INT,
        "instructions" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clinical Orders
    await queryRunner.query(`
      CREATE TABLE "clinical_orders" (
        "order_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" UUID REFERENCES "examination_sessions"("session_id") ON DELETE CASCADE,
        "record_id" UUID REFERENCES "medical_records"("record_id") ON DELETE CASCADE,
        "patient_id" UUID REFERENCES "patients"("patient_id") ON DELETE CASCADE,
        "ordered_by" UUID NOT NULL,
        "order_type" VARCHAR(50) NOT NULL,
        "test_type" VARCHAR(100) NOT NULL,
        "clinical_indication" TEXT,
        "teeth_numbers" INT[],
        "urgency" VARCHAR(20) DEFAULT 'routine',
        "status" VARCHAR(20) DEFAULT 'ordered',
        "ordered_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "scheduled_date" TIMESTAMP,
        "completed_date" TIMESTAMP,
        "result_url" TEXT,
        "report" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Lab Test Results
    await queryRunner.query(`
      CREATE TABLE "lab_test_results" (
        "result_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" UUID REFERENCES "clinical_orders"("order_id") ON DELETE CASCADE,
        "test_name" VARCHAR(255) NOT NULL,
        "result_value" TEXT,
        "result_unit" VARCHAR(50),
        "reference_range" VARCHAR(100),
        "is_abnormal" BOOLEAN DEFAULT FALSE,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Image Categories
    await queryRunner.query(`
      CREATE TABLE "image_categories" (
        "category_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "category_name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Dental Images
    await queryRunner.query(`
      CREATE TABLE "dental_images" (
        "image_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_id" UUID REFERENCES "patients"("patient_id") ON DELETE CASCADE,
        "record_id" UUID REFERENCES "medical_records"("record_id"),
        "category_id" UUID REFERENCES "image_categories"("category_id"),
        "image_type" VARCHAR(50) NOT NULL,
        "image_url" TEXT NOT NULL,
        "thumbnail_url" TEXT,
        "file_size_kb" INT,
        "file_format" VARCHAR(10),
        "tooth_numbers" INT[],
        "view_angle" VARCHAR(50),
        "description" TEXT,
        "tags" TEXT[],
        "metadata" JSONB,
        "pacs_id" VARCHAR(255),
        "taken_date" DATE,
        "taken_by" UUID,
        "uploaded_by" UUID NOT NULL,
        "is_archived" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Image Annotations
    await queryRunner.query(`
      CREATE TABLE "image_annotations" (
        "annotation_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "image_id" UUID REFERENCES "dental_images"("image_id") ON DELETE CASCADE,
        "annotated_by" UUID NOT NULL,
        "annotation_type" VARCHAR(50),
        "annotation_data" JSONB,
        "note" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // PACS Sync Logs
    await queryRunner.query(`
      CREATE TABLE "pacs_sync_logs" (
        "sync_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "image_id" UUID REFERENCES "dental_images"("image_id"),
        "sync_type" VARCHAR(50),
        "pacs_server" VARCHAR(255),
        "status" VARCHAR(20),
        "error_message" TEXT,
        "synced_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Indexes
    await queryRunner.query(
      `CREATE INDEX "idx_patients_code" ON "patients"("patient_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_records_patient" ON "medical_records"("patient_id", "visit_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_exam_sessions_record" ON "examination_sessions"("record_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_exam_sessions_appointment" ON "examination_sessions"("appointment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_prescriptions_patient" ON "prescriptions"("patient_id", "prescription_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_prescriptions_session" ON "prescriptions"("session_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_treatment_plans_session" ON "treatment_plans"("session_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clinical_orders_patient" ON "clinical_orders"("patient_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clinical_orders_session" ON "clinical_orders"("session_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_images_patient" ON "dental_images"("patient_id", "taken_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_images_type" ON "dental_images"("image_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_dental_charts_record" ON "dental_charts"("record_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_symptoms_session" ON "symptoms"("session_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_record_exports_patient" ON "record_exports"("patient_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_record_versions_record" ON "medical_record_versions"("record_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_record_versions_record"`);
    await queryRunner.query(`DROP INDEX "idx_record_exports_patient"`);
    await queryRunner.query(`DROP INDEX "idx_symptoms_session"`);
    await queryRunner.query(`DROP INDEX "idx_dental_charts_record"`);
    await queryRunner.query(`DROP INDEX "idx_images_type"`);
    await queryRunner.query(`DROP INDEX "idx_images_patient"`);
    await queryRunner.query(`DROP INDEX "idx_clinical_orders_patient"`);
    await queryRunner.query(`DROP INDEX "idx_clinical_orders_session"`);
    await queryRunner.query(`DROP INDEX "idx_prescriptions_session"`);
    await queryRunner.query(`DROP INDEX "idx_treatment_plans_session"`);
    await queryRunner.query(`DROP INDEX "idx_prescriptions_patient"`);
    await queryRunner.query(`DROP INDEX "idx_exam_sessions_record"`);
    await queryRunner.query(`DROP INDEX "idx_records_patient"`);
    await queryRunner.query(`DROP INDEX "idx_patients_code"`);

    await queryRunner.query(`DROP TABLE "pacs_sync_logs"`);
    await queryRunner.query(`DROP TABLE "image_annotations"`);
    await queryRunner.query(`DROP TABLE "dental_images"`);
    await queryRunner.query(`DROP TABLE "image_categories"`);
    await queryRunner.query(`DROP TABLE "lab_test_results"`);
    await queryRunner.query(`DROP TABLE "clinical_orders"`);
    await queryRunner.query(`DROP TABLE "prescription_items"`);
    await queryRunner.query(`DROP TABLE "prescriptions"`);
    await queryRunner.query(`DROP TABLE "treatment_history"`);
    await queryRunner.query(`DROP TABLE "treatment_plans"`);
    await queryRunner.query(`DROP TABLE "diagnoses"`);
    await queryRunner.query(`DROP TABLE "symptoms"`);
    await queryRunner.query(`DROP TABLE "examination_sessions"`);
    await queryRunner.query(`DROP TABLE "dental_charts"`);
    await queryRunner.query(`DROP TABLE "record_exports"`);
    await queryRunner.query(`DROP TABLE "medical_record_versions"`);
    await queryRunner.query(`DROP TABLE "medical_records"`);
    await queryRunner.query(`DROP TABLE "medical_history"`);
    await queryRunner.query(`DROP TABLE "patients"`);
  }
}
