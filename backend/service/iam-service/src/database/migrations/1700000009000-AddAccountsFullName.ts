import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add Full Name Column */
export class AddAccountsFullName1700000009000 implements MigrationInterface {
  name = 'AddAccountsFullName1700000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP COLUMN IF EXISTS "full_name"`,
    );
  }
}
