import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { getSanitizedErrorMetadata } from '../../../common/error-metadata';
import { IAM_ACCOUNTS } from './iam-seed-data';

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

export async function runSeed(): Promise<void> {
  console.log('Running IAM account seed...');

  try {
    await dataSource.initialize();
    await dataSource.transaction(async (manager) => {
      for (const account of IAM_ACCOUNTS) {
        await manager.query(
          `
            INSERT INTO accounts (
              account_id,
              username,
              email,
              phone,
              full_name,
              gender,
              password_hash,
              role,
              status,
              email_verified,
              phone_verified
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', true, $9)
            ON CONFLICT (account_id) DO UPDATE SET
              username = EXCLUDED.username,
              email = EXCLUDED.email,
              phone = EXCLUDED.phone,
              full_name = EXCLUDED.full_name,
              gender = EXCLUDED.gender,
              password_hash = EXCLUDED.password_hash,
              role = EXCLUDED.role,
              status = EXCLUDED.status,
              email_verified = EXCLUDED.email_verified,
              phone_verified = EXCLUDED.phone_verified,
              failed_login_attempts = 0,
              locked_at = NULL,
              locked_reason = NULL,
              locked_by = NULL,
              updated_at = CURRENT_TIMESTAMP
          `,
          [
            account.accountId,
            account.username,
            account.email,
            account.phone,
            account.fullName,
            account.gender,
            account.passwordHash,
            account.role,
            account.role !== 'PATIENT',
          ],
        );
      }
    });

    console.log(`IAM account seed completed with ${IAM_ACCOUNTS.length} accounts.`);
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

if (require.main === module) {
  void runSeed();
}
