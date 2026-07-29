import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Shrinks payment_service_db columns to the exact length their value set needs.
 *
 *   payments.currency      10 -> char(3)  ISO 4217 (CHECK-constrained)
 *   payments.status        20 ->  8  'pending' | 'paid' | 'failed' | 'refunded'
 *   payments.refund_status 20 -> 12  RefundStatus, 'UNDER_REVIEW'
 *
 * payments.provider stays varchar(30). Only 'vnpay' exists today, but the set of
 * payment gateways grows with the business rather than being pinned by an enum —
 * tightening to 5 would reject 'zalopay' on the day it is added. That is slack
 * kept on purpose, not an oversight.
 *
 * payments.provider_txn_ref stays varchar(100): it is an opaque reference minted
 * by the gateway, so its maximum is not ours to decide.
 */
export class TightenColumnWidths1719230300000 implements MigrationInterface {
  name = 'TightenColumnWidths1719230300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "currency" TYPE CHAR(3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "status" TYPE VARCHAR(8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "refund_status" TYPE VARCHAR(12)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "refund_status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "status" TYPE VARCHAR(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "currency" TYPE VARCHAR(10)`,
    );
  }
}
