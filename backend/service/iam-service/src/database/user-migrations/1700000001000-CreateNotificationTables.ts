import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTables1700000001000 implements MigrationInterface {
  name = 'CreateNotificationTables1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Notification Templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_templates" (
        "template_id"       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "template_code"     VARCHAR(100) UNIQUE NOT NULL,
        "name"              VARCHAR(255) NOT NULL,
        "description"       TEXT,
        "subject_template"  TEXT,
        "body_template"     TEXT NOT NULL,
        "channel"           VARCHAR(20) NOT NULL,
        "is_active"         BOOLEAN NOT NULL DEFAULT true,
        "created_at"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_templates_code"
       ON "notification_templates" ("template_code")`,
    );

    // Notifications Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "notification_id"     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "recipient_id"        UUID        NOT NULL,
        "template_id"         UUID,
        "notification_type"   VARCHAR(100),
        "channel"             VARCHAR(20) NOT NULL,
        "subject"             TEXT,
        "message"             TEXT        NOT NULL,
        "status"              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "related_entity_id"   UUID,
        "related_entity_type" VARCHAR(100),
        "retry_count"         INTEGER     NOT NULL DEFAULT 0,
        "max_retries"         INTEGER     NOT NULL DEFAULT 3,
        "next_retry_at"       TIMESTAMP,
        "error_message"       TEXT,
        "scheduled_at"        TIMESTAMP,
        "sent_at"             TIMESTAMP,
        "read_at"             TIMESTAMP,
        "created_at"          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
        "updated_at"          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Fix Template Id Type
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notifications'
            AND column_name = 'template_id'
            AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "FK_notifications_template";
          ALTER TABLE "notifications"
            ALTER COLUMN "template_id" TYPE UUID USING "template_id"::uuid;
        END IF;
      END $$
    `);

    // Fix Recipient Id Type
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notifications'
            AND column_name = 'recipient_id'
            AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "notifications"
            ALTER COLUMN "recipient_id" TYPE UUID USING "recipient_id"::uuid;
        END IF;
      END $$
    `);

    // Fix Related Entity Id
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notifications'
            AND column_name = 'related_entity_id'
            AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "notifications"
            ALTER COLUMN "related_entity_id" TYPE UUID
            USING NULLIF("related_entity_id", '')::uuid;
        END IF;
      END $$
    `);

    // Add Missing Columns
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'retry_count') THEN
          ALTER TABLE "notifications" ADD COLUMN "retry_count" INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'max_retries') THEN
          ALTER TABLE "notifications" ADD COLUMN "max_retries" INTEGER NOT NULL DEFAULT 3;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'next_retry_at') THEN
          ALTER TABLE "notifications" ADD COLUMN "next_retry_at" TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'error_message') THEN
          ALTER TABLE "notifications" ADD COLUMN "error_message" TEXT;
        END IF;
      END $$
    `);

    // Drop Stale Column
    await queryRunner.query(`
      ALTER TABLE "notifications" DROP COLUMN IF EXISTS "is_read"
    `);

    // Recreate Template Fk
    await queryRunner.query(`
      ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "FK_notifications_template"
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
        ADD CONSTRAINT "FK_notifications_template"
        FOREIGN KEY ("template_id")
        REFERENCES "notification_templates" ("template_id")
        ON DELETE SET NULL
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_recipient"
       ON "notifications" ("recipient_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_status"
       ON "notifications" ("status")`,
    );

    // Notification Delivery Logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_delivery_logs" (
        "log_id"              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
        "notification_id"     UUID,
        "gateway_name"        VARCHAR(50),
        "gateway_response_id" VARCHAR(255),
        "status"              VARCHAR(20),
        "error_payload"       JSONB,
        "created_at"          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Recreate Delivery Fk
    await queryRunner.query(`
      ALTER TABLE "notification_delivery_logs"
        DROP CONSTRAINT IF EXISTS "FK_delivery_logs_notification"
    `);
    await queryRunner.query(`
      ALTER TABLE "notification_delivery_logs"
        ADD CONSTRAINT "FK_delivery_logs_notification"
        FOREIGN KEY ("notification_id")
        REFERENCES "notifications" ("notification_id")
        ON DELETE CASCADE
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_delivery_logs_notification_id"
       ON "notification_delivery_logs" ("notification_id")`,
    );

    // Notification Preferences
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_preferences" (
        "preference_id"     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"           UUID        NOT NULL,
        "notification_type" VARCHAR(100) NOT NULL,
        "channel"           VARCHAR(20) NOT NULL,
        "is_enabled"        BOOLEAN NOT NULL DEFAULT true,
        "created_at"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("user_id", "notification_type", "channel")
      )
    `);

    // Fix User Id Type
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notification_preferences'
            AND column_name = 'user_id'
            AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "notification_preferences"
            ALTER COLUMN "user_id" TYPE UUID USING "user_id"::uuid;
        END IF;
      END $$
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_preferences_user"
       ON "notification_preferences" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_delivery_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_templates" CASCADE`);
  }
}
