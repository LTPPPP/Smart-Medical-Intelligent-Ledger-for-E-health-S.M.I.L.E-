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

    // Notifications
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "notification_id"   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "recipient_id"      VARCHAR(36) NOT NULL,
        "template_id"       VARCHAR(36),
        "notification_type" VARCHAR(100),
        "channel"           VARCHAR(20) NOT NULL,
        "subject"           TEXT,
        "message"           TEXT NOT NULL,
        "status"            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "is_read"           BOOLEAN NOT NULL DEFAULT false,
        "related_entity_id" VARCHAR(36),
        "related_entity_type" VARCHAR(100),
        "scheduled_at"      TIMESTAMP,
        "sent_at"           TIMESTAMP,
        "read_at"           TIMESTAMP,
        "created_at"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_notifications_template"
          FOREIGN KEY ("template_id")
          REFERENCES "notification_templates" ("template_id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_recipient"
       ON "notifications" ("recipient_id")`,
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
        "attempt_number"      INTEGER DEFAULT 1,
        "delivered_at"        TIMESTAMP,
        "created_at"          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_delivery_logs_notification"
          FOREIGN KEY ("notification_id")
          REFERENCES "notifications" ("notification_id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_delivery_logs_notification_id"
       ON "notification_delivery_logs" ("notification_id")`,
    );

    // Notification Preferences
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_preferences" (
        "preference_id"     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"           VARCHAR(36) NOT NULL,
        "notification_type" VARCHAR(100) NOT NULL,
        "channel"           VARCHAR(20) NOT NULL,
        "is_enabled"        BOOLEAN NOT NULL DEFAULT true,
        "created_at"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("user_id", "notification_type", "channel")
      )
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
