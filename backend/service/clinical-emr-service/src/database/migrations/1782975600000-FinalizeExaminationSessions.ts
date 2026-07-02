import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinalizeExaminationSessions1782975600000
  implements MigrationInterface
{
  name = 'FinalizeExaminationSessions1782975600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "examination_sessions"
      ADD COLUMN IF NOT EXISTS "signed_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "examination_sessions"
      ADD COLUMN IF NOT EXISTS "signed_by" UUID
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "examination_sessions"
      DROP COLUMN IF EXISTS "signed_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "examination_sessions"
      DROP COLUMN IF EXISTS "signed_at"
    `);
  }
}
