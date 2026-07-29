import 'dotenv/config';
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { CreateClinicServiceTables1700000000000 } from './clinic-migrations/1700000000000-CreateClinicServiceTables';
import { AppointmentNoDoubleBooking1730000000000 } from './clinic-migrations/1730000000000-AppointmentNoDoubleBooking';
import { CreateIdempotencyKeys1730000000001 } from './clinic-migrations/1730000000001-CreateIdempotencyKeys';
import { CanonicalAppointmentAvailability1730000000002 } from './clinic-migrations/1730000000002-CanonicalAppointmentAvailability';
import { AppointmentFollowUpLinks1730000000004 } from './clinic-migrations/1730000000004-AppointmentFollowUpLinks';
import { AppointmentReminderTracking1730000000005 } from './clinic-migrations/1730000000005-AppointmentReminderTracking';
import { DropAppointmentPatientForeignKey1730000000006 } from './clinic-migrations/1730000000006-DropAppointmentPatientForeignKey';
import { AddEnumCheckConstraints1730000000007 } from './clinic-migrations/1730000000007-AddEnumCheckConstraints';
import { TightenColumnWidths1730000000008 } from './clinic-migrations/1730000000008-TightenColumnWidths';

export const ClinicDataSource = new DataSource({
  type: process.env.DATABASE_TYPE || 'postgres',
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
  logging: process.env.CLINIC_DATABASE_LOGGING === 'true',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [
    CreateClinicServiceTables1700000000000,
    AppointmentNoDoubleBooking1730000000000,
    CreateIdempotencyKeys1730000000001,
    CanonicalAppointmentAvailability1730000000002,
    AppointmentFollowUpLinks1730000000004,
    AppointmentReminderTracking1730000000005,
    DropAppointmentPatientForeignKey1730000000006,
    AddEnumCheckConstraints1730000000007,
    TightenColumnWidths1730000000008,
  ],
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
