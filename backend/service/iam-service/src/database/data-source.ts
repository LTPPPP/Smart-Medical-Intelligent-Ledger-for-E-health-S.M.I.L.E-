import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'auth_service_db',
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  logging: process.env.NODE_ENV !== 'production',
  entities: [
    __dirname + '/../../**/*.entity{.ts,.js}',
  ],
  migrations: [
    __dirname + '/migrations/*{.ts,.js}',
  ],
  migrationsTableName: 'migrations',
};

export const AppDataSource = new DataSource(options);
