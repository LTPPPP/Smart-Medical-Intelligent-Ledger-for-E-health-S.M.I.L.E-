import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { getSanitizedErrorMetadata } from '../../../common/error-metadata';

config();

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'auth_service_db',
  synchronize: false,
  logging: false,
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
});

async function runSeed() {
  console.log('Running seeds...');

  try {
    await dataSource.initialize();

    const accounts = [
      {
        account_id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'admin',
        email: 'admin@smile.com',
        full_name: 'Admin User',
        password_hash: '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'ADMIN',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440001',
        username: 'doctor1',
        email: 'doctor1@smile.com',
        full_name: 'Dr. Alex Nguyen',
        password_hash: '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'DOCTOR',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440002',
        username: 'doctor2',
        email: 'doctor2@smile.com',
        full_name: 'Dr. Bella Tran',
        password_hash: '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'DOCTOR',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440003',
        username: 'receptionist1',
        email: 'receptionist1@smile.com',
        full_name: 'Chris Le',
        password_hash: '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'RECEPTIONIST',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440004',
        username: 'patient1',
        email: 'patient1@smile.com',
        full_name: 'Diana Pham',
        password_hash: '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'PATIENT',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440005',
        username: 'patient2',
        email: 'patient2@smile.com',
        full_name: 'Evan Hoang',
        password_hash: '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'PATIENT',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440006',
        username: 'nurse1',
        email: 'nurse1@smile.com',
        full_name: 'Frank Pham',
        password_hash: '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'NURSE',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440007',
        username: 'manager1',
        email: 'manager1@smile.com',
        full_name: 'Morgan Tran',
        password_hash: '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6',
        role: 'MANAGER',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
    ];

    for (const account of accounts) {
      await dataSource.query(
        `
        INSERT INTO accounts (account_id, username, email, full_name, password_hash, role, status, email_verified, phone_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (account_id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          email_verified = EXCLUDED.email_verified,
          phone_verified = EXCLUDED.phone_verified
      `,
        [
          account.account_id,
          account.username,
          account.email,
          account.full_name,
          account.password_hash,
          account.role,
          account.status,
          account.email_verified,
          account.phone_verified,
        ],
      );
    }

    console.log('Seeds completed successfully!');
  } catch (error) {
    const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
    console.error('IAM seed failed', {
      operation: 'seed_accounts',
      error_class: errorClass,
      error_code: errorCode,
    });
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

runSeed();
