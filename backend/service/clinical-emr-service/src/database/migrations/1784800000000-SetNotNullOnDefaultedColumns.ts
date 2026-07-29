import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CreateMedicalServiceTables1700000000000 created many columns with a DEFAULT
 * but without NOT NULL, while every entity declares them as non-nullable
 * (plain @Column with a default, or @CreateDateColumn/@UpdateDateColumn).
 * This migration backfills NULLs with the column default and adds the
 * constraint, so the DB finally matches the entities.
 *
 * Deliberately NOT touched: the nullable FK columns with drift NOTEs in
 * schema.sql (medical_records.patient_id, symptoms.session_id, ...) — those
 * cannot be backfilled mechanically.
 *
 * patient_representatives and examination_session_amendments already have
 * NOT NULL timestamps (their own migrations created them correctly).
 */
export class SetNotNullOnDefaultedColumns1784800000000
  implements MigrationInterface
{
  name = 'SetNotNullOnDefaultedColumns1784800000000';

  private readonly columns: Array<[table: string, column: string]> = [
    // Status/flag columns with defaults (entity says NOT NULL)
    ['medical_records', 'record_status'],
    ['examination_sessions', 'status'],
    ['examination_sessions', 'started_at'],
    ['clinical_orders', 'urgency'],
    ['clinical_orders', 'status'],
    ['lab_test_results', 'is_abnormal'],
    ['dental_images', 'is_archived'],
    ['pacs_sync_logs', 'synced_at'],
    ['treatment_plans', 'status'],
    ['treatment_history', 'status'],
    ['prescriptions', 'status'],
    // created_at / updated_at (@CreateDateColumn/@UpdateDateColumn imply NOT NULL)
    ['patients', 'created_at'],
    ['patients', 'updated_at'],
    ['medical_history', 'created_at'],
    ['medical_history', 'updated_at'],
    ['medical_records', 'created_at'],
    ['medical_records', 'updated_at'],
    ['medical_record_versions', 'created_at'],
    ['record_exports', 'created_at'],
    ['examination_sessions', 'created_at'],
    ['symptoms', 'created_at'],
    ['symptoms', 'updated_at'],
    ['diagnoses', 'created_at'],
    ['dental_charts', 'created_at'],
    ['dental_charts', 'updated_at'],
    ['image_categories', 'created_at'],
    ['image_categories', 'updated_at'],
    ['dental_images', 'created_at'],
    ['dental_images', 'updated_at'],
    ['image_annotations', 'created_at'],
    ['image_annotations', 'updated_at'],
    ['pacs_sync_logs', 'created_at'],
    ['pacs_sync_logs', 'updated_at'],
    ['clinical_orders', 'created_at'],
    ['clinical_orders', 'updated_at'],
    ['lab_test_results', 'created_at'],
    ['treatment_plans', 'created_at'],
    ['treatment_plans', 'updated_at'],
    ['treatment_history', 'created_at'],
    ['treatment_history', 'updated_at'],
    ['prescriptions', 'created_at'],
    ['prescriptions', 'updated_at'],
    ['prescription_items', 'created_at'],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of this.columns) {
      await queryRunner.query(
        `UPDATE "${table}" SET "${column}" = DEFAULT WHERE "${column}" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET NOT NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of [...this.columns].reverse()) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP NOT NULL`,
      );
    }
  }
}
