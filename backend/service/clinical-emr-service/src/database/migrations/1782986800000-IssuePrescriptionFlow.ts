import { MigrationInterface, QueryRunner } from 'typeorm';

export class IssuePrescriptionFlow1782986800000 implements MigrationInterface {
  name = 'IssuePrescriptionFlow1782986800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "session_id" UUID
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "issued_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "issued_by" UUID
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ADD COLUMN IF NOT EXISTS "cancellation_reason" TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ALTER COLUMN "status" SET DEFAULT 'draft'
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_prescriptions_session'
        ) THEN
          ALTER TABLE "prescriptions"
          ADD CONSTRAINT "fk_prescriptions_session"
          FOREIGN KEY ("session_id")
          REFERENCES "examination_sessions"("session_id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_prescriptions_session"
      ON "prescriptions"("session_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_prescriptions_session"`);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP CONSTRAINT IF EXISTS "fk_prescriptions_session"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      ALTER COLUMN "status" SET DEFAULT 'active'
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "cancellation_reason"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "cancelled_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "issued_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "issued_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
      DROP COLUMN IF EXISTS "session_id"
    `);
  }
}
