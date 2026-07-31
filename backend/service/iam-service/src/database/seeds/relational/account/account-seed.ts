import { MigrationInterface, QueryRunner } from 'typeorm';
import { IAM_ACCOUNTS } from '../iam-seed-data';

/**
 * Compatibility entrypoint for environments that still execute seed
 * migrations directly. The package seed runner remains the canonical command,
 * and both paths consume the same deterministic data.
 */
export class SeedAccounts1700000100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const account of IAM_ACCOUNTS) {
      await queryRunner.query(
        `
          INSERT INTO accounts (
            account_id,
            username,
            email,
            full_name,
            gender,
            password_hash,
            role,
            status,
            email_verified,
            phone_verified
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', true, false)
          ON CONFLICT (account_id) DO UPDATE SET
            username = EXCLUDED.username,
            email = EXCLUDED.email,
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
          account.fullName,
          account.gender,
          account.passwordHash,
          account.role,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM accounts WHERE account_id = ANY($1::uuid[])`, [
      IAM_ACCOUNTS.map(({ accountId }) => accountId),
    ]);
  }
}
