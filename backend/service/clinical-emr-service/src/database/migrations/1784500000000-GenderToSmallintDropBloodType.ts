import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Converts patients.gender from VARCHAR(10) text to a smallint ISO/IEC 5218 code
 * and drops patients.blood_type entirely.
 *
 *   'MALE'   -> 1
 *   'FEMALE' -> 2
 *   'OTHER'  -> 0
 *   NULL     -> NULL
 *
 * Anything unrecognized becomes 0 (unknown) rather than failing the cast, which
 * matches how AddEnumCheckConstraints1784300000000 already nulled out junk.
 *
 * The down() path restores the text column and the old constraint, but
 * blood_type data cannot be recovered — the column is dropped, not archived.
 */
export class GenderToSmallintDropBloodType1784500000000
  implements MigrationInterface
{
  name = 'GenderToSmallintDropBloodType1784500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- patients.gender: text -> smallint ---
    await queryRunner.query(
      `ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "chk_patients_gender"`,
    );
    await queryRunner.query(`
      ALTER TABLE "patients"
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
      ALTER TABLE "patients" ADD CONSTRAINT "chk_patients_gender"
      CHECK ("gender" IN (0, 1, 2))
    `);

    // --- patients.blood_type: removed ---
    await queryRunner.query(
      `ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "chk_patients_blood_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" DROP COLUMN IF EXISTS "blood_type"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // --- patients.blood_type: recreated empty ---
    await queryRunner.query(
      `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "blood_type" VARCHAR(10)`,
    );
    await queryRunner.query(`
      ALTER TABLE "patients" ADD CONSTRAINT "chk_patients_blood_type"
      CHECK ("blood_type" IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
    `);

    // --- patients.gender: smallint -> text ---
    await queryRunner.query(
      `ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "chk_patients_gender"`,
    );
    await queryRunner.query(`
      ALTER TABLE "patients"
      ALTER COLUMN "gender" TYPE VARCHAR(10)
      USING CASE "gender"
        WHEN 1 THEN 'MALE'
        WHEN 2 THEN 'FEMALE'
        WHEN 0 THEN 'OTHER'
        ELSE NULL
      END
    `);
    await queryRunner.query(`
      ALTER TABLE "patients" ADD CONSTRAINT "chk_patients_gender"
      CHECK ("gender" IN ('MALE', 'FEMALE', 'OTHER'))
    `);
  }
}
