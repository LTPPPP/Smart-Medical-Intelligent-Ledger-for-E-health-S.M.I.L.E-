import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.USER_DATABASE_HOST || process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.USER_DATABASE_PORT || process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.USER_DATABASE_USERNAME || process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.USER_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.USER_DATABASE_NAME || 'account_service_db',
  synchronize: process.env.USER_DATABASE_SYNCHRONIZE === 'true',
  logging: process.env.NODE_ENV !== 'production',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/user-migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
};

export const UserDataSource = new DataSource(options);
