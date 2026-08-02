import { MigrationInterface, QueryRunner } from 'typeorm';

// Tighten Column Widths
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
    // Fixed Width Currency
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
