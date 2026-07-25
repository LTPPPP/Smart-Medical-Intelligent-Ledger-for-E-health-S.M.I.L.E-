import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Shrinks user_service_db columns to the exact length their value set needs.
 *
 *   roles.role_name                    50 -> 12   RoleEnum, 'RECEPTIONIST'
 *   kyc_verifications.verification_status 30 -> 14 KycStatus, 'PENDING_REVIEW'
 *   kyc_verifications.ocr_status       30 -> 10   KycOcrStatus, 'PROCESSING'
 *   kyc_verifications.decision_source  20 ->  6   KycDecisionSource, 'MANUAL'
 *   kyc_verifications.document_hash    255 -> char(64)  sha256 hex of the ID scan
 *   notification_templates.channel     20 ->  5   'EMAIL' (CHECK-constrained)
 *   notification_preferences.channel   20 ->  5   same
 *   notifications.channel              20 ->  5   same
 *   notifications.status               20 ->  9   NotificationStatus, 'cancelled'
 *
 * Left alone on purpose, because their value set is open rather than pinned:
 * permissions.{permission_name,resource,action} grow with each new feature
 * (the seed already contains 'statistics', which the original doc comment did
 * not list); audit_logs.{action,resource} are free text; kyc id_type,
 * processing_purpose, consent_version and the notification_type columns have no
 * enum defining them.
 */
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

    // channel is CHECK-constrained on all three tables; constraints survive.
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
