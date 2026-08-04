import { MigrationInterface, QueryRunner } from 'typeorm';

// Gender To Smallint
export class GenderToSmallintDropBloodType1784500000000
  implements MigrationInterface
{
  name = 'GenderToSmallintDropBloodType1784500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Gender Text To Smallint
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

    // Remove Blood Type
    await queryRunner.query(
      `ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "chk_patients_blood_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" DROP COLUMN IF EXISTS "blood_type"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate Blood Type
    await queryRunner.query(
      `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "blood_type" VARCHAR(10)`,
    );
    await queryRunner.query(`
      ALTER TABLE "patients" ADD CONSTRAINT "chk_patients_blood_type"
      CHECK ("blood_type" IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
    `);

    // Gender Smallint To Text
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
