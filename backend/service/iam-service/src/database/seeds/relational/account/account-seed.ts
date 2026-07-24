import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class SeedAccounts1700000100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const accountsData = [
      {
        account_id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'admin',
        email: 'admin@smile.com',
        password_hash:
          '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'ADMIN',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440001',
        username: 'doctor1',
        email: 'doctor1@smile.com',
        password_hash:
          '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'DOCTOR',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440002',
        username: 'doctor2',
        email: 'doctor2@smile.com',
        password_hash:
          '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'DOCTOR',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440003',
        username: 'receptionist1',
        email: 'receptionist1@smile.com',
        password_hash:
          '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'RECEPTIONIST',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440004',
        username: 'patient1',
        email: 'patient1@smile.com',
        password_hash:
          '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'PATIENT',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440005',
        username: 'patient2',
        email: 'patient2@smile.com',
        password_hash:
          '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'PATIENT',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440007',
        username: 'manager1',
        email: 'manager1@smile.com',
        password_hash:
          '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'MANAGER',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
    ];

    for (const account of accountsData) {
      await queryRunner.query(`
        INSERT INTO accounts (account_id, username, email, password_hash, role, status, email_verified, phone_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          failed_login_attempts = 0,
          locked_at = NULL,
          locked_reason = NULL
      `, [
        account.account_id,
        account.username,
        account.email,
        account.password_hash,
        account.role,
        account.status,
        account.email_verified,
        account.phone_verified,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM accounts WHERE email IN (
        'admin@smile.com',
        'doctor1@smile.com',
        'doctor2@smile.com',
        'receptionist1@smile.com',
        'patient1@smile.com',
        'patient2@smile.com',
        'manager1@smile.com'
      )
    `);
  }
}
