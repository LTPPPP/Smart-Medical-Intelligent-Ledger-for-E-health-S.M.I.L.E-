import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayments1719230000000 implements MigrationInterface {
  name = 'CreatePayments1719230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" (
        "payment_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appointment_id" uuid NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'VND',
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "provider" character varying(30) NOT NULL DEFAULT 'vnpay',
        "provider_txn_ref" character varying(100),
        "order_info" text,
        "refund_amount" numeric(12,2),
        "refunded_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments_payment_id" PRIMARY KEY ("payment_id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_appointment_id" ON "payments" ("appointment_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payments_appointment_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
  }
}
