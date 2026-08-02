import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add Kyc Verified By Fk */
export class AddKycVerifiedByFk1700000005000 implements MigrationInterface {
  name = 'AddKycVerifiedByFk1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clear Dangling Pointers
    await queryRunner.query(`
      UPDATE "kyc_verifications"
      SET "verified_by" = NULL
      WHERE "verified_by" IS NOT NULL
        AND "verified_by" NOT IN (SELECT "user_id" FROM "users")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_kyc_verifications_verified_by'
        ) THEN
          ALTER TABLE "kyc_verifications"
          ADD CONSTRAINT "fk_kyc_verifications_verified_by"
          FOREIGN KEY ("verified_by")
          REFERENCES "users"("user_id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_kyc_verifications_verified_by"
      ON "kyc_verifications"("verified_by")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_kyc_verifications_verified_by"`,
    );
    await queryRunner.query(`
      ALTER TABLE "kyc_verifications"
      DROP CONSTRAINT IF EXISTS "fk_kyc_verifications_verified_by"
    `);
  }
}
