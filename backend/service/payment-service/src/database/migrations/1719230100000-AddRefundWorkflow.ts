import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefundWorkflow1719230100000 implements MigrationInterface {
  name = 'AddRefundWorkflow1719230100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments"
        ADD COLUMN IF NOT EXISTS "refund_status" character varying(20),
        ADD COLUMN IF NOT EXISTS "refund_reason" text,
        ADD COLUMN IF NOT EXISTS "refund_requested_by" uuid,
        ADD COLUMN IF NOT EXISTS "refund_requested_at" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "refund_reviewed_by" uuid,
        ADD COLUMN IF NOT EXISTS "refund_reviewed_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_refund_status" ON "payments" ("refund_status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payments_refund_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments"
        DROP COLUMN IF EXISTS "refund_status",
        DROP COLUMN IF EXISTS "refund_reason",
        DROP COLUMN IF EXISTS "refund_requested_by",
        DROP COLUMN IF EXISTS "refund_requested_at",
        DROP COLUMN IF EXISTS "refund_reviewed_by",
        DROP COLUMN IF EXISTS "refund_reviewed_at"`,
    );
  }
}
