import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOtpTokens1700000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'otp_tokens',
        columns: [
          {
            name: 'otp_id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'account_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'otp_code',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'otp_type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'idx_otp_tokens_account',
            columnNames: ['account_id'],
          },
          {
            name: 'idx_otp_tokens_expires',
            columnNames: ['expires_at'],
          },
        ],
      }),
      true,
    );

    await queryRunner.query(`
      ALTER TABLE otp_tokens
      ADD CONSTRAINT fk_otp_tokens_account
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE otp_tokens DROP CONSTRAINT fk_otp_tokens_account
    `);
    await queryRunner.dropTable('otp_tokens');
  }
}
