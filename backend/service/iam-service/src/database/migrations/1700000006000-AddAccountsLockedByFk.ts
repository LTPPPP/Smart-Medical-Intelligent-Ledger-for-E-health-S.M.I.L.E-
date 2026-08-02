import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add Locked By Fk */
export class AddAccountsLockedByFk1700000006000 implements MigrationInterface {
  name = 'AddAccountsLockedByFk1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clear Dangling Pointers
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
