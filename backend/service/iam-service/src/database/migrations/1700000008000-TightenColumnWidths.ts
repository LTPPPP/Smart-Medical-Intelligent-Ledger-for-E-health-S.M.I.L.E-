import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Shrinks account_service_db columns to the exact length their value set needs,
 * removing the safety margin the original schema carried.
 *
 * Only columns whose value set is pinned by a TS enum / DB CHECK, or whose
 * length is fixed by the algorithm producing it, are touched. Free-text and
 * third-party-controlled columns (username, email, phone, provider_user_id,
 * device_info) keep their widths, since "the longest value" is not knowable
 * for them.
 *
 *   accounts.role          20 -> 12   RoleEnum, 'RECEPTIONIST'
 *   accounts.status        20 -> 11   AccountStatus, 'DEACTIVATED'
 *   accounts.password_hash 255 -> 60  bcryptjs output is always 60 chars
 *   oauth_connections.provider 50 -> 8   'facebook' (google/facebook/apple)
 *   refresh_tokens.token_hash 255 -> char(64)  sha256 hex, always 64
 *   otp_tokens.otp_code    10 -> char(6)   generateOtpCode() is 6 digits
 *   otp_tokens.otp_type    20 -> 15   OtpType, 'identity_verify'
 *
 * char(n) is used only where every value is exactly n characters; varchar(n)
 * where n is an upper bound. Shrinking rewrites the table; widening again later
 * is a metadata-only change in PostgreSQL, so a new enum value stays cheap.
 */
export class TightenColumnWidths1700000008000 implements MigrationInterface {
  name = 'TightenColumnWidths1700000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // role is CHECK-constrained; the constraint survives a width change.
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
