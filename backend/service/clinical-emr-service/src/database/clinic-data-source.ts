import 'dotenv/config';
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';

export const ClinicDataSource = new DataSource({
  type: process.env.DATABASE_TYPE,
  host: process.env.CLINIC_DATABASE_HOST || process.env.DATABASE_HOST,
  port: process.env.CLINIC_DATABASE_PORT
    ? parseInt(process.env.CLINIC_DATABASE_PORT, 10)
    : process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 5432,
  username:
    process.env.CLINIC_DATABASE_USERNAME || process.env.DATABASE_USERNAME,
  password:
    process.env.CLINIC_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.CLINIC_DATABASE_NAME || 'core_clinic_service_db',
  synchronize: false,
  dropSchema: false,
  keepConnectionAlive: true,
  logging: process.env.NODE_ENV !== 'production',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/clinic-migrations/**/*{.ts,.js}'],
  extra: {
    max: process.env.DATABASE_MAX_CONNECTIONS
      ? parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10)
      : 100,
    ssl:
      process.env.DATABASE_SSL_ENABLED === 'true'
        ? {
            rejectUnauthorized:
              process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
            ca: process.env.DATABASE_CA ?? undefined,
            key: process.env.DATABASE_KEY ?? undefined,
            cert: process.env.DATABASE_CERT ?? undefined,
          }
        : undefined,
  },
} as DataSourceOptions);
