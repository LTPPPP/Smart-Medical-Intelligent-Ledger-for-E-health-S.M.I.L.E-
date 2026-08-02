import { MigrationInterface, QueryRunner } from 'typeorm';

// Add Currency Check Constraint
export class AddEnumCheckConstraints1719230200000
  implements MigrationInterface
{
  name = 'AddEnumCheckConstraints1719230200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "payments" SET "currency" = UPPER("currency") WHERE "currency" IS NOT NULL`,
    );
    await queryRunner.query(`
      UPDATE "payments" SET "currency" = 'VND'
      WHERE "currency" IS NULL OR "currency" NOT IN ('VND', 'USD', 'EUR', 'JPY')
    `);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "chk_payments_currency"`,
    );
    await queryRunner.query(`
      ALTER TABLE "payments" ADD CONSTRAINT "chk_payments_currency"
      CHECK ("currency" IN ('VND', 'USD', 'EUR', 'JPY'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "chk_payments_currency"`,
    );
  }
}
