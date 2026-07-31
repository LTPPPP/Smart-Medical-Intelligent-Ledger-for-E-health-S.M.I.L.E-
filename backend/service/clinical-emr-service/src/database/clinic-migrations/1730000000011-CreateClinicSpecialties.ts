import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stores the specialties offered by each clinic. The entity and specialties
 * service existed before the mapping table was included in the migration
 * chain, which made reads fail at runtime when clinic links were requested.
 */
export class CreateClinicSpecialties1730000000011
  implements MigrationInterface
{
  name = 'CreateClinicSpecialties1730000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinic_specialties" (
        "clinic_id" UUID NOT NULL REFERENCES "clinics"("clinic_id") ON DELETE CASCADE,
        "specialty_id" UUID NOT NULL REFERENCES "specialties"("specialty_id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_clinic_specialties" PRIMARY KEY ("clinic_id", "specialty_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clinic_specialties_specialty"
        ON "clinic_specialties" ("specialty_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_clinic_specialties_specialty"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "clinic_specialties"`);
  }
}
