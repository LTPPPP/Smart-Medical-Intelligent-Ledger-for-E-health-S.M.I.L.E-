import { MigrationInterface, QueryRunner } from 'typeorm';

// Enum Check Constraints
export class AddEnumCheckConstraints1784300000000
  implements MigrationInterface
{
  name = 'AddEnumCheckConstraints1784300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Patients Gender
    await queryRunner.query(
      `UPDATE "patients" SET "gender" = UPPER("gender") WHERE "gender" IS NOT NULL`,
    );
    await queryRunner.query(`
      UPDATE "patients" SET "gender" = NULL
      WHERE "gender" IS NOT NULL AND "gender" NOT IN ('MALE', 'FEMALE', 'OTHER')
    `);
    await queryRunner.query(
      `ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "chk_patients_gender"`,
    );
    await queryRunner.query(`
      ALTER TABLE "patients" ADD CONSTRAINT "chk_patients_gender"
      CHECK ("gender" IN ('MALE', 'FEMALE', 'OTHER'))
    `);

    // Patients Blood Type
    await queryRunner.query(
      `UPDATE "patients" SET "blood_type" = UPPER("blood_type") WHERE "blood_type" IS NOT NULL`,
    );
    await queryRunner.query(`
      UPDATE "patients" SET "blood_type" = NULL
      WHERE "blood_type" IS NOT NULL
        AND "blood_type" NOT IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    `);
    await queryRunner.query(
      `ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "chk_patients_blood_type"`,
    );
    await queryRunner.query(`
      ALTER TABLE "patients" ADD CONSTRAINT "chk_patients_blood_type"
      CHECK ("blood_type" IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
    `);

    // Treatment Plans Currency
    await queryRunner.query(
      `UPDATE "treatment_plans" SET "quote_currency" = UPPER("quote_currency") WHERE "quote_currency" IS NOT NULL`,
    );
    await queryRunner.query(`
      UPDATE "treatment_plans" SET "quote_currency" = NULL
      WHERE "quote_currency" IS NOT NULL AND "quote_currency" NOT IN ('VND', 'USD', 'EUR', 'JPY')
    `);
    await queryRunner.query(
      `ALTER TABLE "treatment_plans" DROP CONSTRAINT IF EXISTS "chk_treatment_plans_quote_currency"`,
    );
    await queryRunner.query(`
      ALTER TABLE "treatment_plans" ADD CONSTRAINT "chk_treatment_plans_quote_currency"
      CHECK ("quote_currency" IN ('VND', 'USD', 'EUR', 'JPY'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "chk_patients_gender"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "chk_patients_blood_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treatment_plans" DROP CONSTRAINT IF EXISTS "chk_treatment_plans_quote_currency"`,
    );
  }
}
