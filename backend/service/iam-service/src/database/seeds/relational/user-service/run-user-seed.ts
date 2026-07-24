import { DataSource } from 'typeorm';
import { config } from 'dotenv';

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

async function runUserSeed() {
  console.log('🌱 Running user-service seeds...');

  try {
    await dataSource.initialize();

    // ─── Seed Roles ───
    const roles = [
      {
        role_id: 'a0000000-0000-0000-0000-000000000001',
        role_name: 'ADMIN',
        description: 'System administrator with full access',
      },
      {
        role_id: 'a0000000-0000-0000-0000-000000000002',
        role_name: 'DOCTOR',
        description: 'Dental doctor / physician',
      },
      { role_id: 'a0000000-0000-0000-0000-000000000003', role_name: 'RECEPTIONIST', description: 'Front desk staff' },
      { role_id: 'a0000000-0000-0000-0000-000000000004', role_name: 'PATIENT', description: 'Patient user' },
      { role_id: 'a0000000-0000-0000-0000-000000000005', role_name: 'MANAGER', description: 'Clinic manager' },
      { role_id: 'a0000000-0000-0000-0000-000000000006', role_name: 'NURSE', description: 'Clinical support nurse' },
    ];

    for (const role of roles) {
      await dataSource.query(
        `INSERT INTO roles (role_id, role_name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (role_name) DO NOTHING`,
        [role.role_id, role.role_name, role.description],
      );
    }
    console.log('  ✅ Roles seeded');

    // ─── Seed Permissions ───
    const permissions = [
      // Patient management
      { permission_name: 'patient:read', resource: 'patient', action: 'read', description: 'View patient records' },
      {
        permission_name: 'patient:create',
        resource: 'patient',
        action: 'create',
        description: 'Create patient records',
      },
      {
        permission_name: 'patient:update',
        resource: 'patient',
        action: 'update',
        description: 'Update patient records',
      },
      {
        permission_name: 'patient:delete',
        resource: 'patient',
        action: 'delete',
        description: 'Delete patient records',
      },
      // Appointment management
      {
        permission_name: 'appointment:read',
        resource: 'appointment',
        action: 'read',
        description: 'View appointments',
      },
      {
        permission_name: 'appointment:create',
        resource: 'appointment',
        action: 'create',
        description: 'Create appointments',
      },
      {
        permission_name: 'appointment:update',
        resource: 'appointment',
        action: 'update',
        description: 'Update appointments',
      },
      {
        permission_name: 'appointment:delete',
        resource: 'appointment',
        action: 'delete',
        description: 'Cancel appointments',
      },
      // Medical records
      {
        permission_name: 'medical_record:read',
        resource: 'medical_record',
        action: 'read',
        description: 'View medical records',
      },
      {
        permission_name: 'medical_record:create',
        resource: 'medical_record',
        action: 'create',
        description: 'Create medical records',
      },
      {
        permission_name: 'medical_record:update',
        resource: 'medical_record',
        action: 'update',
        description: 'Update medical records',
      },
      // Billing
      { permission_name: 'payment:read', resource: 'payment', action: 'read', description: 'View payments' },
      { permission_name: 'payment:create', resource: 'payment', action: 'create', description: 'Create payments' },
      // Admin
      { permission_name: 'user:manage', resource: 'user', action: 'manage', description: 'Manage user accounts' },
      {
        permission_name: 'system:admin',
        resource: 'system',
        action: 'admin',
        description: 'Full system administration',
      },
    ];

    for (const perm of permissions) {
      await dataSource.query(
        `INSERT INTO permissions (permission_name, resource, action, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (permission_name) DO NOTHING`,
        [perm.permission_name, perm.resource, perm.action, perm.description],
      );
    }
    console.log('  ✅ Permissions seeded');

    // ─── Seed Role-Permissions ───
    const rolePermissions: Record<string, string[]> = {
      ADMIN: permissions.map((p) => p.permission_name), // all permissions
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

    for (const [roleName, permNames] of Object.entries(rolePermissions)) {
      for (const permName of permNames) {
        await dataSource.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT r.role_id, p.permission_id
           FROM roles r, permissions p
           WHERE r.role_name = $1 AND p.permission_name = $2
             AND NOT EXISTS (
               SELECT 1
               FROM role_permissions rp
               WHERE rp.role_id = r.role_id AND rp.permission_id = p.permission_id
             )`,
          [roleName, permName],
        );
      }
    }
    console.log('  ✅ Role-Permissions seeded');

    // ─── Seed Users (matching auth accounts) ───
    const users = [
      {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        full_name: 'Admin User',
        email: 'admin@smile.com',
        role: 'ADMIN',
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        full_name: 'Dr. Nguyen Van A',
        email: 'doctor1@smile.com',
        role: 'DOCTOR',
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        full_name: 'Dr. Tran Thi B',
        email: 'doctor2@smile.com',
        role: 'DOCTOR',
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440003',
        full_name: 'Le Van C',
        email: 'receptionist1@smile.com',
        role: 'RECEPTIONIST',
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440004',
        full_name: 'Pham Thi D',
        email: 'patient1@smile.com',
        role: 'PATIENT',
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440005',
        full_name: 'Hoang Van E',
        email: 'patient2@smile.com',
        role: 'PATIENT',
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440006',
        full_name: 'Pham Van F',
        email: 'nurse1@smile.com',
        role: 'NURSE',
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440007',
        full_name: 'Tran Thi Manager',
        email: 'manager1@smile.com',
        role: 'MANAGER',
      },
    ];

    for (const user of users) {
      await dataSource.query(
        `INSERT INTO users (user_id, full_name, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           email = EXCLUDED.email`,
        [user.user_id, user.full_name, user.email],
      );

      // Assign role
      await dataSource.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1::uuid, r.role_id
         FROM roles r
         WHERE r.role_name = $2
           AND NOT EXISTS (
             SELECT 1
             FROM user_roles ur
             WHERE ur.user_id = $1::uuid AND ur.role_id = r.role_id
           )`,
        [user.user_id, user.role],
      );
    }
    console.log('  ✅ Users & User-Roles seeded');

    console.log('🌱 User-service seed completed successfully!');
  } catch (error) {
    console.error('❌ User-service seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runUserSeed();
