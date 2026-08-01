import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add Notification User Fks */
export class AddNotificationUserFks1700000006000
  implements MigrationInterface
{
  name = 'AddNotificationUserFks1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Notifications Recipient Fk
    await queryRunner.query(`
      DELETE FROM "notifications"
      WHERE "recipient_id" NOT IN (SELECT "user_id" FROM "users")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_notifications_recipient'
        ) THEN
          ALTER TABLE "notifications"
          ADD CONSTRAINT "fk_notifications_recipient"
          FOREIGN KEY ("recipient_id")
          REFERENCES "users"("user_id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Preferences User Fk
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notification_preferences'
            AND column_name = 'user_id'
            AND data_type = 'character varying'
        ) THEN
          DELETE FROM "notification_preferences"
          WHERE "user_id" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

          ALTER TABLE "notification_preferences"
          ALTER COLUMN "user_id" TYPE UUID USING "user_id"::uuid;
        END IF;
      END $$
    `);
    await queryRunner.query(`
      DELETE FROM "notification_preferences"
      WHERE "user_id" NOT IN (SELECT "user_id" FROM "users")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_notification_preferences_user'
        ) THEN
          ALTER TABLE "notification_preferences"
          ADD CONSTRAINT "fk_notification_preferences_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("user_id")
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      DROP CONSTRAINT IF EXISTS "fk_notification_preferences_user"
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      DROP CONSTRAINT IF EXISTS "fk_notifications_recipient"
    `);
  }
}
