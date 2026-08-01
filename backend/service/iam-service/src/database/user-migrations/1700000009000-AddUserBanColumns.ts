import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add User Ban Columns */
export class AddUserBanColumns1700000009000 implements MigrationInterface {
  name = 'AddUserBanColumns1700000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "is_banned" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "banned_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "ban_reason" TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "ban_reason",
        DROP COLUMN IF EXISTS "banned_at",
        DROP COLUMN IF EXISTS "is_banned"
    `);
  }
}
