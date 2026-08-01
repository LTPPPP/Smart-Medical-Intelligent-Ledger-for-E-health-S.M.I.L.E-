import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserServiceTables1700000000000 implements MigrationInterface {
  name = 'CreateUserServiceTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users Table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" UUID PRIMARY KEY,
        "full_name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255),
        "phone" VARCHAR(20),
        "date_of_birth" DATE,
        "gender" VARCHAR(10),
        "avatar_url" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      )
    `);

    // Roles Table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "role_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "role_name" VARCHAR(50) UNIQUE NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      )
    `);

    // Permissions Table
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "permission_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "permission_name" VARCHAR(100) UNIQUE NOT NULL,
        "resource" VARCHAR(50) NOT NULL,
        "action" VARCHAR(20) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      )
    `);

    // Role Permissions Table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "role_id" UUID REFERENCES "roles"("role_id") ON DELETE CASCADE,
        "permission_id" UUID REFERENCES "permissions"("permission_id") ON DELETE CASCADE,
        "assigned_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "assigned_by" UUID,
        UNIQUE("role_id", "permission_id")
      )
    `);

    // User Roles Table
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("user_id") ON DELETE CASCADE,
        "role_id" UUID REFERENCES "roles"("role_id") ON DELETE CASCADE,
        "assigned_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "assigned_by" UUID,
        UNIQUE("user_id", "role_id")
      )
    `);

    // Digital Signatures Table
    await queryRunner.query(`
      CREATE TABLE "digital_signatures" (
        "signature_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("user_id") ON DELETE CASCADE,
        "signature_data" TEXT NOT NULL,
        "certificate_url" TEXT,
        "status" VARCHAR(20) DEFAULT 'ACTIVE',
        "expires_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      )
    `);

    // Phone Verifications Table
    await queryRunner.query(`
      CREATE TABLE "phone_verifications" (
        "verification_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("user_id") ON DELETE CASCADE,
        "phone" VARCHAR(20) NOT NULL,
        "verified_at" TIMESTAMP,
        "is_verified" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Kyc Verifications Table
    await queryRunner.query(`
      CREATE TABLE "kyc_verifications" (
        "kyc_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("user_id") ON DELETE CASCADE,
        "id_type" VARCHAR(50) NOT NULL,
        "id_number" VARCHAR(100) NOT NULL,
        "id_front_image" TEXT,
        "id_back_image" TEXT,
        "selfie_image" TEXT,
        "verification_status" VARCHAR(20) DEFAULT 'pending',
        "verified_at" TIMESTAMP,
        "verified_by" UUID,
        "document_hash" VARCHAR(255),
        "notes" TEXT,
        "admin_notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      )
    `);

    // Audit Logs Table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "log_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("user_id"),
        "action" VARCHAR(100) NOT NULL,
        "resource" VARCHAR(100) NOT NULL,
        "resource_id" UUID,
        "ip_address" VARCHAR(45),
        "user_agent" TEXT,
        "details" JSONB,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Indexes
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users"("email")`);
    await queryRunner.query(`CREATE INDEX "idx_users_phone" ON "users"("phone")`);
    await queryRunner.query(`CREATE INDEX "idx_kyc_status" ON "kyc_verifications"("verification_status")`);
    await queryRunner.query(`CREATE INDEX "idx_kyc_user" ON "kyc_verifications"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_digital_signatures_user" ON "digital_signatures"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action")`);
    await queryRunner.query(`CREATE INDEX "idx_phone_verifications_user" ON "phone_verifications"("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop Indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_phone_verifications_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_digital_signatures_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_kyc_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_kyc_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email"`);
    // Drop Tables
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kyc_verifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "phone_verifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "digital_signatures"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
