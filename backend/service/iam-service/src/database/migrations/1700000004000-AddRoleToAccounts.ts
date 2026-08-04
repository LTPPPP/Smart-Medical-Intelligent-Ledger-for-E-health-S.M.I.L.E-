import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleToAccounts1700000004000 implements MigrationInterface {
  name = 'AddRoleToAccounts1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Role Column
    const hasRole = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'accounts' AND column_name = 'role'
    `);

    if (hasRole.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "accounts" ADD COLUMN "role" VARCHAR(20) DEFAULT 'PATIENT'
      `);
      await queryRunner.query(`
        CREATE INDEX "idx_accounts_role" ON "accounts"("role")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_accounts_role"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN IF EXISTS "role"`);
  }
}
