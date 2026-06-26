import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileFieldsToAccounts1700000005000 implements MigrationInterface {
  name = 'AddProfileFieldsToAccounts1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD COLUMN IF NOT EXISTS "full_name" VARCHAR,
      ADD COLUMN IF NOT EXISTS "gender" VARCHAR,
      ADD COLUMN IF NOT EXISTS "date_of_birth" DATE,
      ADD COLUMN IF NOT EXISTS "address" TEXT,
      ADD COLUMN IF NOT EXISTS "avatar_url" TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounts"
      DROP COLUMN IF EXISTS "avatar_url",
      DROP COLUMN IF EXISTS "address",
      DROP COLUMN IF EXISTS "date_of_birth",
      DROP COLUMN IF EXISTS "gender",
      DROP COLUMN IF EXISTS "full_name"
    `);
  }
}
