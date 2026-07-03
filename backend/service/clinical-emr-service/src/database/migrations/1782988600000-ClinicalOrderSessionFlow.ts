import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClinicalOrderSessionFlow1782988600000
  implements MigrationInterface
{
  name = 'ClinicalOrderSessionFlow1782988600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clinical_orders"
      ADD COLUMN IF NOT EXISTS "session_id" UUID
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_clinical_orders_session'
        ) THEN
          ALTER TABLE "clinical_orders"
          ADD CONSTRAINT "fk_clinical_orders_session"
          FOREIGN KEY ("session_id")
          REFERENCES "examination_sessions"("session_id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clinical_orders_session"
      ON "clinical_orders"("session_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_clinical_orders_session"`);
    await queryRunner.query(`
      ALTER TABLE "clinical_orders"
      DROP CONSTRAINT IF EXISTS "fk_clinical_orders_session"
    `);
    await queryRunner.query(`
      ALTER TABLE "clinical_orders"
      DROP COLUMN IF EXISTS "session_id"
    `);
  }
}
