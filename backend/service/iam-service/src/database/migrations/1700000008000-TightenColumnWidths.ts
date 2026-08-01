import { MigrationInterface, QueryRunner } from 'typeorm';

/** Tighten Column Widths */
export class TightenColumnWidths1700000008000 implements MigrationInterface {
  name = 'TightenColumnWidths1700000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Role Check Constrained
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "role" TYPE VARCHAR(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "status" TYPE VARCHAR(11)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "password_hash" TYPE VARCHAR(60)`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_connections" ALTER COLUMN "provider" TYPE VARCHAR(8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "token_hash" TYPE CHAR(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "otp_tokens" ALTER COLUMN "otp_code" TYPE CHAR(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "otp_tokens" ALTER COLUMN "otp_type" TYPE VARCHAR(15)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "otp_tokens" ALTER COLUMN "otp_type" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "otp_tokens" ALTER COLUMN "otp_code" TYPE VARCHAR(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "token_hash" TYPE VARCHAR(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_connections" ALTER COLUMN "provider" TYPE VARCHAR(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "password_hash" TYPE VARCHAR(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "role" TYPE VARCHAR(20)`,
    );
  }
}
