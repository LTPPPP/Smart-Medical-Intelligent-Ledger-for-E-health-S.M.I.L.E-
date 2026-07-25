import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the users ban columns: is_banned, banned_at, ban_reason.
 *
 * UserProfileEntity declares all three and `database/iam-service/user-service/
 * schema.sql` lists them, but CreateUserServiceTables1700000000000 never created
 * them — so a database provisioned from the migration chain was missing columns
 * every generated SELECT referenced. Login failed with
 * `42703 column UserProfileEntity.is_banned does not exist` as soon as the
 * accounts.full_name phantom was fixed and the query got that far.
 *
 * banned_at is timestamptz to match the entity, which is the one deliberately
 * timezone-aware column in the schema.
 */
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
