import { MigrationInterface, QueryRunner } from 'typeorm';

// Enum Check Constraints
export class AddEnumCheckConstraints1730000000007
  implements MigrationInterface
{
  name = 'AddEnumCheckConstraints1730000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Services Currency
    await queryRunner.query(
      `UPDATE "services" SET "currency" = UPPER("currency") WHERE "currency" IS NOT NULL`,
    );
    await queryRunner.query(`
      UPDATE "services" SET "currency" = 'VND'
      WHERE "currency" IS NOT NULL AND "currency" NOT IN ('VND', 'USD', 'EUR', 'JPY')
    `);
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "chk_services_currency"`,
    );
    await queryRunner.query(`
      ALTER TABLE "services" ADD CONSTRAINT "chk_services_currency"
      CHECK ("currency" IN ('VND', 'USD', 'EUR', 'JPY'))
    `);

    // Channel Columns
    const channelTables = [
      'appointment_notification_logs',
      'appointment_reminder_preferences',
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
      `ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "chk_services_currency"`,
    );
    for (const table of [
      'appointment_notification_logs',
      'appointment_reminder_preferences',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "chk_${table}_channel"`,
      );
    }
  }
}
