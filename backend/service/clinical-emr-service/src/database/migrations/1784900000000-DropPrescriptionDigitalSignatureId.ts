import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Digital signature was never implemented (no entity/controller ever
 * mapped this column or the iam-service digital_signatures table it
 * pointed to). Dropping the dead column.
 */
export class DropPrescriptionDigitalSignatureId1784900000000
  implements MigrationInterface
{
  name = 'DropPrescriptionDigitalSignatureId1784900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "prescriptions" DROP COLUMN IF EXISTS "digital_signature_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ADD COLUMN "digital_signature_id" UUID`,
    );
  }
}
