import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushSubscriptions1700000010000 implements MigrationInterface {
  name = 'CreatePushSubscriptions1700000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_push_subscriptions" (
        "subscription_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "endpoint" TEXT NOT NULL,
        "p256dh" VARCHAR(255) NOT NULL,
        "auth" VARCHAR(255) NOT NULL,
        "user_agent" VARCHAR(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "uq_push_subscriptions_endpoint" UNIQUE ("endpoint"),
        CONSTRAINT "fk_push_subscriptions_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_push_subscriptions_user"
        ON "notification_push_subscriptions"("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_push_subscriptions_user"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "notification_push_subscriptions"`,
    );
  }
}
