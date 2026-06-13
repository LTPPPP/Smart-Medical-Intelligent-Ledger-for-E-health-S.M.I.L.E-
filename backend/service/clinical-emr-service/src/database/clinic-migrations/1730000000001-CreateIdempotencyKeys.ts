import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdempotencyKeys1730000000001 implements MigrationInterface {
  name = 'CreateIdempotencyKeys1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "idempotency_keys" (
        "idempotency_key" VARCHAR(255) PRIMARY KEY,
        "method" VARCHAR(10) NOT NULL,
        "path" VARCHAR(512) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'in_progress',
        "response_status" INTEGER,
        "response_body" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_idempotency_expires" ON "idempotency_keys"("expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_idempotency_expires"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "idempotency_keys"`);
  }
}
