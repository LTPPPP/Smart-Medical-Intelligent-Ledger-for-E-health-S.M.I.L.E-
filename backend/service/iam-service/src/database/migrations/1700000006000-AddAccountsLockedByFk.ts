import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * accounts.locked_by holds the account_id of the admin who locked an account,
 * but carried no FK. Self-referential, same DB -> a real FK is possible.
 * ON DELETE SET NULL: if the admin account is removed, the lock record stays
 * and only the dangling pointer is cleared.
 */
export class AddAccountsLockedByFk1700000006000 implements MigrationInterface {
  name = 'AddAccountsLockedByFk1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clear any dangling pointers so the FK can be validated.
    await queryRunner.query(`
      UPDATE "accounts"
      SET "locked_by" = NULL
      WHERE "locked_by" IS NOT NULL
        AND "locked_by" NOT IN (SELECT "account_id" FROM "accounts")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_accounts_locked_by'
        ) THEN
          ALTER TABLE "accounts"
          ADD CONSTRAINT "fk_accounts_locked_by"
          FOREIGN KEY ("locked_by")
          REFERENCES "accounts"("account_id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_accounts_locked_by"
      ON "accounts"("locked_by")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_accounts_locked_by"`);
    await queryRunner.query(`
      ALTER TABLE "accounts"
      DROP CONSTRAINT IF EXISTS "fk_accounts_locked_by"
    `);
  }
}
