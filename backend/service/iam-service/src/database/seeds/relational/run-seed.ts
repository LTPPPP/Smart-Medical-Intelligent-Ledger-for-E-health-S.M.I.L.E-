import { DataSource } from 'typeorm';
import { config } from 'dotenv';

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
        password_hash: '$2b$10$iBWv69tIQe9tuaBYhHBIbedpmMBuUow2s5ksIYxsm5Nmdpg0Mec7K',
        role: 'ADMIN',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440001',
        username: 'doctor1',
        email: 'doctor1@smile.com',
        password_hash: '$2b$10$iBWv69tIQe9tuaBYhHBIbedpmMBuUow2s5ksIYxsm5Nmdpg0Mec7K',
        role: 'DOCTOR',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440002',
        username: 'doctor2',
        email: 'doctor2@smile.com',
        password_hash: '$2b$10$iBWv69tIQe9tuaBYhHBIbedpmMBuUow2s5ksIYxsm5Nmdpg0Mec7K',
        role: 'DOCTOR',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440003',
        username: 'receptionist1',
        email: 'receptionist1@smile.com',
        password_hash: '$2b$10$iBWv69tIQe9tuaBYhHBIbedpmMBuUow2s5ksIYxsm5Nmdpg0Mec7K',
        role: 'RECEPTIONIST',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440004',
        username: 'patient1',
        email: 'patient1@smile.com',
        password_hash: '$2b$10$iBWv69tIQe9tuaBYhHBIbedpmMBuUow2s5ksIYxsm5Nmdpg0Mec7K',
        role: 'PATIENT',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440005',
        username: 'patient2',
        email: 'patient2@smile.com',
        password_hash: '$2b$10$iBWv69tIQe9tuaBYhHBIbedpmMBuUow2s5ksIYxsm5Nmdpg0Mec7K',
        role: 'PATIENT',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
      {
        account_id: '550e8400-e29b-41d4-a716-446655440006',
        username: 'nurse1',
        email: 'nurse1@smile.com',
        password_hash: '$2b$10$iBWv69tIQe9tuaBYhHBIbedpmMBuUow2s5ksIYxsm5Nmdpg0Mec7K',
        role: 'NURSE',
        status: 'ACTIVE',
        email_verified: true,
        phone_verified: true,
      },
    ];

    for (const account of accounts) {
      await dataSource.query(
        `
        INSERT INTO accounts (account_id, username, email, password_hash, role, status, email_verified, phone_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash
      `,
        [
          account.account_id,
          account.username,
          account.email,
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
    console.error('Error running seeds:', error);
  } finally {
    await dataSource.destroy();
  }
}

runSeed();
