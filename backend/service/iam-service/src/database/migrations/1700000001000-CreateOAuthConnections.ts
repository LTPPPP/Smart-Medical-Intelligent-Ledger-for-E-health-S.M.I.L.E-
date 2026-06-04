import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOAuthConnections1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'oauth_connections',
        columns: [
          {
            name: 'connection_id',
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
            name: 'provider',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'provider_user_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'access_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'refresh_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'token_expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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
            name: 'idx_oauth_connections_account',
            columnNames: ['account_id'],
          },
          {
            name: 'idx_oauth_connections_provider_user',
            columnNames: ['provider', 'provider_user_id'],
            isUnique: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.query(`
      ALTER TABLE oauth_connections
      ADD CONSTRAINT fk_oauth_connections_account
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oauth_connections DROP CONSTRAINT fk_oauth_connections_account
    `);
    await queryRunner.dropTable('oauth_connections');
  }
}
