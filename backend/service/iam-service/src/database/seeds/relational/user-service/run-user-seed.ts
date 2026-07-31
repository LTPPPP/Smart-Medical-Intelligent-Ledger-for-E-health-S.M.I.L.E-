import { config } from 'dotenv';
import { DataSource, EntityManager } from 'typeorm';
import { getSanitizedErrorMetadata } from '../../../../common/error-metadata';
import {
  IAM_ACCOUNTS,
  IAM_AUDIT_LOGS,
  IAM_KYC_VERIFICATIONS,
  IAM_NOTIFICATION_DELIVERY_LOGS,
  IAM_NOTIFICATION_PREFERENCES,
  IAM_NOTIFICATIONS,
  IAM_NOTIFICATION_TEMPLATE,
  IAM_PHONE_VERIFICATIONS,
  IAM_ROLES,
} from '../iam-seed-data';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.USER_DATABASE_HOST || process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.USER_DATABASE_PORT || process.env.DATABASE_PORT || '5432', 10),
  username: process.env.USER_DATABASE_USERNAME || process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.USER_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.USER_DATABASE_NAME || 'account_service_db',
  synchronize: false,
  logging: false,
});

const permissions = [
  {
    permissionName: 'patient:read',
    resource: 'patient',
    action: 'read',
    description: 'View patient records',
  },
  {
    permissionName: 'patient:create',
    resource: 'patient',
    action: 'create',
    description: 'Create patient records',
  },
  {
    permissionName: 'patient:update',
    resource: 'patient',
    action: 'update',
    description: 'Update patient records',
  },
  {
    permissionName: 'patient:delete',
    resource: 'patient',
    action: 'delete',
    description: 'Delete patient records',
  },
  {
    permissionName: 'appointment:read',
    resource: 'appointment',
    action: 'read',
    description: 'View appointments',
  },
  {
    permissionName: 'appointment:create',
    resource: 'appointment',
    action: 'create',
    description: 'Create appointments',
  },
  {
    permissionName: 'appointment:update',
    resource: 'appointment',
    action: 'update',
    description: 'Update appointments',
  },
  {
    permissionName: 'appointment:delete',
    resource: 'appointment',
    action: 'delete',
    description: 'Cancel appointments',
  },
  {
    permissionName: 'medical_record:read',
    resource: 'medical_record',
    action: 'read',
    description: 'View medical records',
  },
  {
    permissionName: 'medical_record:create',
    resource: 'medical_record',
    action: 'create',
    description: 'Create medical records',
  },
  {
    permissionName: 'medical_record:update',
    resource: 'medical_record',
    action: 'update',
    description: 'Update medical records',
  },
  {
    permissionName: 'payment:read',
    resource: 'payment',
    action: 'read',
    description: 'View payments',
  },
  {
    permissionName: 'payment:create',
    resource: 'payment',
    action: 'create',
    description: 'Create payments',
  },
  {
    permissionName: 'user:manage',
    resource: 'user',
    action: 'manage',
    description: 'Manage user accounts',
  },
  {
    permissionName: 'system:admin',
    resource: 'system',
    action: 'admin',
    description: 'Full system administration',
  },
] as const;

const rolePermissions: Record<string, readonly string[]> = {
  ADMIN: permissions.map(({ permissionName }) => permissionName),
  DOCTOR: [
    'patient:read',
    'patient:update',
    'appointment:read',
    'appointment:update',
    'medical_record:read',
    'medical_record:create',
    'medical_record:update',
    'payment:read',
  ],
  RECEPTIONIST: [
    'patient:read',
    'patient:create',
    'patient:update',
    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:delete',
    'payment:read',
    'payment:create',
  ],
  PATIENT: ['patient:read', 'appointment:read', 'appointment:create', 'medical_record:read', 'payment:read'],
  MANAGER: [
    'patient:read',
    'patient:create',
    'patient:update',
    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:delete',
    'medical_record:read',
    'payment:read',
    'payment:create',
    'user:manage',
  ],
  NURSE: ['patient:read', 'appointment:read'],
};

async function seedAccessControl(manager: EntityManager): Promise<void> {
  for (const role of IAM_ROLES) {
    await manager.query(
      `
        INSERT INTO roles (role_id, role_name, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (role_name) DO UPDATE SET
          description = EXCLUDED.description,
          updated_at = CURRENT_TIMESTAMP
      `,
      [role.roleId, role.roleName, role.description],
    );
  }

  for (const permission of permissions) {
    await manager.query(
      `
        INSERT INTO permissions (
          permission_name,
          resource,
          action,
          description
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (permission_name) DO UPDATE SET
          resource = EXCLUDED.resource,
          action = EXCLUDED.action,
          description = EXCLUDED.description,
          updated_at = CURRENT_TIMESTAMP
      `,
      [permission.permissionName, permission.resource, permission.action, permission.description],
    );
  }

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    for (const permissionName of permissionNames) {
      await manager.query(
        `
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT role_id, permission_id
          FROM roles
          CROSS JOIN permissions
          WHERE role_name = $1 AND permission_name = $2
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `,
        [roleName, permissionName],
      );
    }
  }
}

async function seedUsers(manager: EntityManager): Promise<void> {
  for (const account of IAM_ACCOUNTS) {
    await manager.query(
      `
        INSERT INTO users (
          user_id,
          full_name,
          email,
          phone,
          date_of_birth,
          gender
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          date_of_birth = EXCLUDED.date_of_birth,
          gender = EXCLUDED.gender,
          updated_at = CURRENT_TIMESTAMP
      `,
      [account.accountId, account.fullName, account.email, account.phone, account.dateOfBirth, account.gender],
    );

    await manager.query(
      `
        DELETE FROM user_roles
        WHERE user_id = $1
          AND role_id <> (SELECT role_id FROM roles WHERE role_name = $2)
      `,
      [account.accountId, account.role],
    );
    await manager.query(
      `
        INSERT INTO user_roles (user_id, role_id)
        SELECT $1::uuid, role_id
        FROM roles
        WHERE role_name = $2
        ON CONFLICT (user_id, role_id) DO NOTHING
      `,
      [account.accountId, account.role],
    );
  }
}

async function seedNotifications(manager: EntityManager): Promise<void> {
  await manager.query(
    `
      INSERT INTO notification_templates (
        template_id,
        template_code,
        name,
        description,
        subject_template,
        body_template,
        channel,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      ON CONFLICT (template_id) DO UPDATE SET
        template_code = EXCLUDED.template_code,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        subject_template = EXCLUDED.subject_template,
        body_template = EXCLUDED.body_template,
        channel = EXCLUDED.channel,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      IAM_NOTIFICATION_TEMPLATE.templateId,
      IAM_NOTIFICATION_TEMPLATE.templateCode,
      IAM_NOTIFICATION_TEMPLATE.name,
      IAM_NOTIFICATION_TEMPLATE.description,
      IAM_NOTIFICATION_TEMPLATE.subjectTemplate,
      IAM_NOTIFICATION_TEMPLATE.bodyTemplate,
      IAM_NOTIFICATION_TEMPLATE.channel,
    ],
  );

  for (const preference of IAM_NOTIFICATION_PREFERENCES) {
    await manager.query(
      `
        INSERT INTO notification_preferences (
          preference_id,
          user_id,
          notification_type,
          channel,
          is_enabled
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, notification_type, channel) DO UPDATE SET
          preference_id = EXCLUDED.preference_id,
          is_enabled = EXCLUDED.is_enabled,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        preference.preferenceId,
        preference.userId,
        preference.notificationType,
        preference.channel,
        preference.isEnabled,
      ],
    );
  }

  for (const notification of IAM_NOTIFICATIONS) {
    await manager.query(
      `
        INSERT INTO notifications (
          notification_id,
          recipient_id,
          template_id,
          notification_type,
          channel,
          subject,
          message,
          status,
          scheduled_at,
          sent_at
        )
        VALUES ($1, $2, $3, 'ACCOUNT', 'APP', $4, $5, 'sent', $6, $7)
        ON CONFLICT (notification_id) DO UPDATE SET
          recipient_id = EXCLUDED.recipient_id,
          template_id = EXCLUDED.template_id,
          notification_type = EXCLUDED.notification_type,
          channel = EXCLUDED.channel,
          subject = EXCLUDED.subject,
          message = EXCLUDED.message,
          status = EXCLUDED.status,
          scheduled_at = EXCLUDED.scheduled_at,
          sent_at = EXCLUDED.sent_at,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        notification.notificationId,
        notification.recipientId,
        IAM_NOTIFICATION_TEMPLATE.templateId,
        notification.subject,
        notification.message,
        notification.scheduledAt,
        notification.sentAt,
      ],
    );
  }

  for (const delivery of IAM_NOTIFICATION_DELIVERY_LOGS) {
    await manager.query(
      `
        INSERT INTO notification_delivery_logs (
          log_id,
          notification_id,
          gateway_name,
          gateway_response_id,
          status,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (log_id) DO UPDATE SET
          notification_id = EXCLUDED.notification_id,
          gateway_name = EXCLUDED.gateway_name,
          gateway_response_id = EXCLUDED.gateway_response_id,
          status = EXCLUDED.status,
          error_payload = NULL,
          created_at = EXCLUDED.created_at
      `,
      [
        delivery.logId,
        delivery.notificationId,
        delivery.gatewayName,
        delivery.gatewayResponseId,
        delivery.status,
        delivery.createdAt,
      ],
    );
  }
}

async function seedStaffVerificationData(manager: EntityManager): Promise<void> {
  for (const kyc of IAM_KYC_VERIFICATIONS) {
    await manager.query(
      `
        INSERT INTO kyc_verifications (
          kyc_id,
          user_id,
          id_type,
          id_number,
          full_name,
          date_of_birth,
          verification_status,
          ocr_status,
          document_hash,
          notes,
          submitted_at,
          verified_at,
          verified_by,
          decision_source,
          decision_reason,
          consent_version,
          consent_accepted_at,
          processing_purpose,
          retention_policy_version,
          retention_expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (kyc_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          id_type = EXCLUDED.id_type,
          id_number = EXCLUDED.id_number,
          full_name = EXCLUDED.full_name,
          date_of_birth = EXCLUDED.date_of_birth,
          verification_status = EXCLUDED.verification_status,
          ocr_status = EXCLUDED.ocr_status,
          document_hash = EXCLUDED.document_hash,
          notes = EXCLUDED.notes,
          submitted_at = EXCLUDED.submitted_at,
          verified_at = EXCLUDED.verified_at,
          verified_by = EXCLUDED.verified_by,
          decision_source = EXCLUDED.decision_source,
          decision_reason = EXCLUDED.decision_reason,
          consent_version = EXCLUDED.consent_version,
          consent_accepted_at = EXCLUDED.consent_accepted_at,
          processing_purpose = EXCLUDED.processing_purpose,
          retention_policy_version = EXCLUDED.retention_policy_version,
          retention_expires_at = EXCLUDED.retention_expires_at,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        kyc.kycId,
        kyc.userId,
        kyc.idType,
        kyc.idNumber,
        kyc.fullName,
        kyc.dateOfBirth,
        kyc.verificationStatus,
        kyc.ocrStatus,
        kyc.documentHash,
        kyc.notes,
        kyc.submittedAt,
        kyc.verifiedAt,
        kyc.verifiedBy,
        kyc.decisionSource,
        kyc.decisionReason,
        kyc.consentVersion,
        kyc.consentAcceptedAt,
        kyc.processingPurpose,
        kyc.retentionPolicyVersion,
        kyc.retentionExpiresAt,
      ],
    );
  }

  for (const verification of IAM_PHONE_VERIFICATIONS) {
    await manager.query(
      `
        INSERT INTO phone_verifications (
          verification_id,
          user_id,
          phone,
          verified_at,
          is_verified
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (verification_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          phone = EXCLUDED.phone,
          verified_at = EXCLUDED.verified_at,
          is_verified = EXCLUDED.is_verified
      `,
      [
        verification.verificationId,
        verification.userId,
        verification.phone,
        verification.verifiedAt,
        verification.isVerified,
      ],
    );
  }

  for (const audit of IAM_AUDIT_LOGS) {
    await manager.query(
      `
        INSERT INTO audit_logs (
          log_id,
          user_id,
          action,
          resource,
          resource_id,
          details,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        ON CONFLICT (log_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          action = EXCLUDED.action,
          resource = EXCLUDED.resource,
          resource_id = EXCLUDED.resource_id,
          details = EXCLUDED.details,
          created_at = EXCLUDED.created_at
      `,
      [
        audit.logId,
        audit.userId,
        audit.action,
        audit.resource,
        audit.resourceId,
        JSON.stringify(audit.details),
        audit.createdAt,
      ],
    );
  }
}

export async function runUserSeed(): Promise<void> {
  console.log('Running IAM profile and access seed...');

  try {
    await dataSource.initialize();
    await dataSource.transaction(async (manager) => {
      await seedAccessControl(manager);
      await seedUsers(manager);
      await seedNotifications(manager);
      await seedStaffVerificationData(manager);
    });

    console.log(`IAM profile seed completed with ${IAM_ACCOUNTS.length} users and notifications.`);
  } catch (error) {
    const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
    console.error('User-service seed failed', {
      operation: 'seed_user_profiles',
      error_class: errorClass,
      error_code: errorCode,
    });
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

if (require.main === module) {
  void runUserSeed();
}
