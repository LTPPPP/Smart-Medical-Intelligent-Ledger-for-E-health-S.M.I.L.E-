import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add Gender Column */
export class AddAccountsGender1700000007000 implements MigrationInterface {
  name = 'AddAccountsGender1700000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "gender" smallint`,
    );

    // Normalize Gender Values
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "chk_accounts_gender"`,
    );
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ALTER COLUMN "gender" TYPE smallint
      USING CASE UPPER(TRIM("gender"::text))
        WHEN 'MALE' THEN 1
        WHEN 'FEMALE' THEN 2
        WHEN 'OTHER' THEN 0
        WHEN '1' THEN 1
        WHEN '2' THEN 2
        WHEN '0' THEN 0
        WHEN '' THEN NULL
        ELSE CASE WHEN "gender" IS NULL THEN NULL ELSE 0 END
      END
    `);
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
