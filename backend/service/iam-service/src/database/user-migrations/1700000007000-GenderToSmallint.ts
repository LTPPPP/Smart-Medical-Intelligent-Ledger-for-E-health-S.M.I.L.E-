import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Converts users.gender from VARCHAR(10) text to a smallint ISO/IEC 5218 code.
 *
 *   'MALE'   -> 1
 *   'FEMALE' -> 2
 *   'OTHER'  -> 0
 *   NULL     -> NULL
 *
 * Anything unrecognized becomes 0 (unknown) rather than failing the cast, which
 * matches how AddEnumCheckConstraints1700000004000 already nulled out junk.
 */
export class GenderToSmallint1700000007000 implements MigrationInterface {
  name = 'GenderToSmallint1700000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_gender"`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "gender" TYPE smallint
      USING CASE UPPER(TRIM("gender"))
        WHEN 'MALE' THEN 1
        WHEN 'FEMALE' THEN 2
        WHEN 'OTHER' THEN 0
        WHEN '1' THEN 1
        WHEN '2' THEN 2
        WHEN '0' THEN 0
        WHEN '' THEN NULL
        ELSE CASE WHEN "gender" IS NULL THEN NULL ELSE 0 END
      END
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "chk_users_gender"
      CHECK ("gender" IN (0, 1, 2))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_gender"`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "gender" TYPE VARCHAR(10)
      USING CASE "gender"
        WHEN 1 THEN 'MALE'
        WHEN 2 THEN 'FEMALE'
        WHEN 0 THEN 'OTHER'
        ELSE NULL
      END
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "chk_users_gender"
      CHECK ("gender" IN ('MALE', 'FEMALE', 'OTHER'))
    `);
  }
}
