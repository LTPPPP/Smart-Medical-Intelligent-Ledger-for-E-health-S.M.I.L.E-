import { MigrationInterface, QueryRunner } from 'typeorm';

/** Tighten Column Widths */
export class TightenColumnWidths1700000008000 implements MigrationInterface {
  name = 'TightenColumnWidths1700000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "role_name" TYPE VARCHAR(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc_verifications" ALTER COLUMN "verification_status" TYPE VARCHAR(14)`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc_verifications" ALTER COLUMN "ocr_status" TYPE VARCHAR(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc_verifications" ALTER COLUMN "decision_source" TYPE VARCHAR(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc_verifications" ALTER COLUMN "document_hash" TYPE CHAR(64)`,
    );

    // Channel Check Constrained
    for (const table of [
      'notification_templates',
      'notification_preferences',
      'notifications',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "channel" TYPE VARCHAR(5)`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "status" TYPE VARCHAR(9)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    for (const table of [
      'notification_templates',
      'notification_preferences',
      'notifications',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "channel" TYPE VARCHAR(20)`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "kyc_verifications" ALTER COLUMN "document_hash" TYPE VARCHAR(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc_verifications" ALTER COLUMN "decision_source" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc_verifications" ALTER COLUMN "ocr_status" TYPE VARCHAR(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc_verifications" ALTER COLUMN "verification_status" TYPE VARCHAR(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "role_name" TYPE VARCHAR(50)`,
    );
  }
}
