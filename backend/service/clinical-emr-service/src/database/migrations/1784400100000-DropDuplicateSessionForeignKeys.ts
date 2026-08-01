import { MigrationInterface, QueryRunner } from 'typeorm';

// Drop Duplicate Fks
export class DropDuplicateSessionForeignKeys1784400100000
  implements MigrationInterface
{
  name = 'DropDuplicateSessionForeignKeys1784400100000';

  private readonly duplicates: Array<{ table: string; constraint: string }> = [
    { table: 'clinical_orders', constraint: 'fk_clinical_orders_session' },
    { table: 'prescriptions', constraint: 'fk_prescriptions_session' },
    { table: 'treatment_plans', constraint: 'fk_treatment_plans_session' },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, constraint } of this.duplicates) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        DROP CONSTRAINT IF EXISTS "${constraint}"
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, constraint } of this.duplicates) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = '${constraint}'
          ) THEN
            ALTER TABLE "${table}"
            ADD CONSTRAINT "${constraint}"
            FOREIGN KEY ("session_id")
            REFERENCES "examination_sessions"("session_id")
            ON DELETE CASCADE;
          END IF;
        END $$;
      `);
    }
  }
}
