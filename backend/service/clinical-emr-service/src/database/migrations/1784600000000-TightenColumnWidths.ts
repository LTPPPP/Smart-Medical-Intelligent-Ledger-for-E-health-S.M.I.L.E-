import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Shrinks core_medical_service_db columns to the exact length their value set
 * needs. Only columns pinned by a TS enum / DB CHECK are touched.
 *
 *   medical_records.record_status  20 ->  9  'draft' | 'finalized'
 *   symptoms.severity              20 ->  8  Severity, 'moderate'
 *   diagnoses.severity             20 ->  8  Severity
 *   clinical_orders.order_type     50 -> 13  OrderType, 'clinical_test'
 *   clinical_orders.urgency        20 ->  7  OrderPriority, 'routine'
 *   clinical_orders.status         20 -> 11  OrderStatus, 'in_progress'
 *   treatment_plans.status         20 -> 18  PlanStatus, 'partially_accepted'
 *   treatment_plans.acceptance_scope 20 -> 7  AcceptanceScope, 'partial'
 *   treatment_plans.quote_currency varchar(3) -> char(3)  ISO 4217 is exactly 3
 *   prescriptions.status           20 ->  9  PrescriptionStatus, 'dispensed'
 *
 * Left alone on purpose, because nothing pins their value set:
 *   - examination_sessions.status and treatment_history.status have no enum;
 *     only 'draft' appears in the code, which is too thin to bound them.
 *   - medical_records.record_hash is supplied by the client through the DTO with
 *     no algorithm enforced, so 64 cannot be assumed.
 *   - diagnoses.icd_code: ICD-10 fits in 8, but ICD-11 stem+extension codes are
 *     longer, so 20 is not slack.
 *   - dental_charts.tooth_status, dental_images.{image_type,view_angle,file_format},
 *     image_annotations.annotation_type, pacs_sync_logs.{sync_type,status},
 *     record_exports.{export_type,export_format}, medical_history.condition_type,
 *     diagnoses.diagnosis_type, prescription_items.route,
 *     treatment_plans.sent_via,
 *     patient_representatives.{relationship,legal_document_type} — all free text.
 */
export class TightenColumnWidths1784600000000 implements MigrationInterface {
  name = 'TightenColumnWidths1784600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "medical_records" ALTER COLUMN "record_status" TYPE VARCHAR(9)`,
    );
    await queryRunner.query(
      `ALTER TABLE "symptoms" ALTER COLUMN "severity" TYPE VARCHAR(8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnoses" ALTER COLUMN "severity" TYPE VARCHAR(8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinical_orders" ALTER COLUMN "order_type" TYPE VARCHAR(13)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinical_orders" ALTER COLUMN "urgency" TYPE VARCHAR(7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinical_orders" ALTER COLUMN "status" TYPE VARCHAR(11)`,
    );
    await queryRunner.query(
      `ALTER TABLE "treatment_plans" ALTER COLUMN "status" TYPE VARCHAR(18)`,
    );
    // quote_currency is already varchar(3); char(3) makes the fixed width explicit.
    await queryRunner.query(
      `ALTER TABLE "treatment_plans" ALTER COLUMN "quote_currency" TYPE CHAR(3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "treatment_plans" ALTER COLUMN "acceptance_scope" TYPE VARCHAR(7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ALTER COLUMN "status" TYPE VARCHAR(9)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "treatment_plans" ALTER COLUMN "acceptance_scope" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "treatment_plans" ALTER COLUMN "quote_currency" TYPE VARCHAR(3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "treatment_plans" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinical_orders" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinical_orders" ALTER COLUMN "urgency" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinical_orders" ALTER COLUMN "order_type" TYPE VARCHAR(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnoses" ALTER COLUMN "severity" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "symptoms" ALTER COLUMN "severity" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_records" ALTER COLUMN "record_status" TYPE VARCHAR(20)`,
    );
  }
}
