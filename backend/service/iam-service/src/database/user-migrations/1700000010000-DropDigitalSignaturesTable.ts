import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * digital_signatures was created but never mapped by a TypeORM entity or
 * exposed by any controller/service — a dropped feature (out of product
 * scope). Dropping the dead table and its index.
 */
export class DropDigitalSignaturesTable1700000010000
  implements MigrationInterface
{
  name = 'DropDigitalSignaturesTable1700000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_digital_signatures_user"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "digital_signatures"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "digital_signatures" (
        "signature_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("user_id") ON DELETE CASCADE,
        "signature_data" TEXT NOT NULL,
        "certificate_url" TEXT,
        "status" VARCHAR(20) DEFAULT 'ACTIVE',
        "expires_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_digital_signatures_user" ON "digital_signatures"("user_id")`,
    );
  }
}
