import { MigrationInterface, QueryRunner } from 'typeorm';

// Tighten Column Widths
export class TightenColumnWidths1719230300000 implements MigrationInterface {
  name = 'TightenColumnWidths1719230300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "currency" TYPE CHAR(3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "status" TYPE VARCHAR(8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "refund_status" TYPE VARCHAR(12)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "refund_status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "currency" TYPE VARCHAR(10)`,
    );
  }
}
