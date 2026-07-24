import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Data-integrity guardrails for bounded "enum" columns in account_service_db.
 * Adds CHECK constraints so only canonical values can be stored, and first
 * normalizes any legacy/dirty rows so ADD CONSTRAINT cannot fail.
 *
 * Note: shrinking VARCHAR length is intentionally NOT done — in PostgreSQL it
 * saves no storage and would force a table rewrite. The value set is what we
 * actually want to constrain. Mirrors chk_accounts_role (main datasource).
 *
 *   gender  -> MALE, FEMALE, OTHER            (nullable)
 *   channel -> SMS, EMAIL, PUSH, APP          (NOT NULL, default APP)
 */
export class AddEnumCheckConstraints1700000004000
  implements MigrationInterface
{
  name = 'AddEnumCheckConstraints1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- users.gender ---
    await queryRunner.query(`
      UPDATE "users" SET "gender" = UPPER("gender") WHERE "gender" IS NOT NULL
    `);
    await queryRunner.query(`
      UPDATE "users" SET "gender" = NULL
      WHERE "gender" IS NOT NULL AND "gender" NOT IN ('MALE', 'FEMALE', 'OTHER')
    `);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_gender"`,
    );
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "chk_users_gender"
      CHECK ("gender" IN ('MALE', 'FEMALE', 'OTHER'))
    `);

    // --- channel columns (SMS, EMAIL, PUSH, APP) ---
    const channelTables = [
      'notifications',
      'notification_preferences',
      'notification_templates',
    ];
    for (const table of channelTables) {
      await queryRunner.query(
        `UPDATE "${table}" SET "channel" = UPPER("channel") WHERE "channel" IS NOT NULL`,
      );
      await queryRunner.query(`
        UPDATE "${table}" SET "channel" = 'APP'
        WHERE "channel" IS NULL OR "channel" NOT IN ('SMS', 'EMAIL', 'PUSH', 'APP')
      `);
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "chk_${table}_channel"`,
      );
      await queryRunner.query(`
        ALTER TABLE "${table}" ADD CONSTRAINT "chk_${table}_channel"
        CHECK ("channel" IN ('SMS', 'EMAIL', 'PUSH', 'APP'))
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_gender"`,
    );
    for (const table of [
      'notifications',
      'notification_preferences',
      'notification_templates',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "chk_${table}_channel"`,
      );
    }
  }
}
