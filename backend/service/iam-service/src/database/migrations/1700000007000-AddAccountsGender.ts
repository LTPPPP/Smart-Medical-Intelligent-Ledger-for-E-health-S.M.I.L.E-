import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds accounts.gender as a smallint ISO/IEC 5218 code.
 *
 * AccountEntity has always declared a `gender` property, but no migration ever
 * created the column — every generated SELECT referenced a column that did not
 * exist unless DATABASE_SYNCHRONIZE=true created it at boot. Since the gender
 * representation is being changed to numeric codes anyway, the column is created
 * here in its final shape.
 *
 *   0 = unknown, 1 = male, 2 = female
 *
 * Note: AccountEntity also declares `full_name`, which has the same missing-DDL
 * problem. That column is deliberately NOT created here — it is unrelated to the
 * gender change and needs its own migration.
 */
export class AddAccountsGender1700000007000 implements MigrationInterface {
  name = 'AddAccountsGender1700000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "gender" smallint`,
    );

    // Normalize anything a previous synchronize run may have written as text.
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "chk_accounts_gender"`,
    );
    await queryRunner.query(`
      ALTER TABLE "accounts" ADD CONSTRAINT "chk_accounts_gender"
      CHECK ("gender" IN (0, 1, 2))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "chk_accounts_gender"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP COLUMN IF EXISTS "gender"`,
    );
  }
}
