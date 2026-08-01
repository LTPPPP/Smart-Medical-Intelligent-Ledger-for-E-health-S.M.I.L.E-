import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add Role Check Constraint */
export class AddRoleCheckConstraint1700000005000 implements MigrationInterface {
  name = 'AddRoleCheckConstraint1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Coerce Invalid Roles
    await queryRunner.query(`
      UPDATE "accounts"
      SET "role" = 'PATIENT'
      WHERE "role" IS NULL
         OR "role" NOT IN ('ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTIONIST', 'NURSE', 'MANAGER')
    `);

    await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "chk_accounts_role"`);
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD CONSTRAINT "chk_accounts_role"
      CHECK ("role" IN ('ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTIONIST', 'NURSE', 'MANAGER'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "chk_accounts_role"`);
  }
}
