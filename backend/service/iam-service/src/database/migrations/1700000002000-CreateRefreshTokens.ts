import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateRefreshTokens1700000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'token_id',
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
            name: 'token_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'device_info',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'idx_refresh_tokens_account',
            columnNames: ['account_id'],
          },
          {
            name: 'idx_refresh_tokens_hash',
            columnNames: ['token_hash'],
          },
        ],
      }),
      true,
    );

    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      ADD CONSTRAINT fk_refresh_tokens_account
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE refresh_tokens DROP CONSTRAINT fk_refresh_tokens_account
    `);
    await queryRunner.dropTable('refresh_tokens');
  }
}
