import 'dotenv/config';
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ClinicEntity } from '../clinics/entities/clinic.entity';
import { TreatmentRoomEntity } from '../treatment-rooms/entities/treatment-room.entity';
import { WorkShiftEntity } from '../work-shifts/entities/work-shift.entity';
import { DoctorScheduleEntity } from '../doctor-schedules/entities/doctor-schedule.entity';
import { ScheduleChangeEntity } from '../doctor-schedules/entities/schedule-change.entity';
import { DoctorLeaveEntity } from '../doctor-leaves/entities/doctor-leave.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { AppointmentStatusHistoryEntity } from '../appointments/entities/appointment-status-history.entity';
import { IdempotencyKeyEntity } from '../appointments/entities/idempotency-key.entity';
import { AppointmentReminderPreferenceEntity } from '../appointments/entities/appointment-reminder-preference.entity';
import { AppointmentNotificationLogEntity } from '../appointments/entities/appointment-notification-log.entity';
import { DoctorSpecialtyEntity } from '../doctor-specialties/entities/doctor-specialty.entity';
import { ServiceCategoryEntity } from '../service-categories/entities/service-category.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { ClinicServiceEntity } from '../services/entities/clinic-service.entity';
import { SpecialtyEntity } from '../specialties/entities/specialty.entity';
import { DiagnosticOrderEntity } from '../diagnostic-orders/entities/diagnostic-order.entity';
import { CreateClinicServiceTables1700000000000 } from './clinic-migrations/1700000000000-CreateClinicServiceTables';
import { AppointmentNoDoubleBooking1730000000000 } from './clinic-migrations/1730000000000-AppointmentNoDoubleBooking';
import { CreateIdempotencyKeys1730000000001 } from './clinic-migrations/1730000000001-CreateIdempotencyKeys';
import { CanonicalAppointmentAvailability1730000000002 } from './clinic-migrations/1730000000002-CanonicalAppointmentAvailability';
import { AppointmentFollowUpLinks1730000000004 } from './clinic-migrations/1730000000004-AppointmentFollowUpLinks';
import { AppointmentReminderTracking1730000000005 } from './clinic-migrations/1730000000005-AppointmentReminderTracking';
import { DropAppointmentPatientForeignKey1730000000006 } from './clinic-migrations/1730000000006-DropAppointmentPatientForeignKey';
import { AddEnumCheckConstraints1730000000007 } from './clinic-migrations/1730000000007-AddEnumCheckConstraints';
import { TightenColumnWidths1730000000008 } from './clinic-migrations/1730000000008-TightenColumnWidths';
import { SetNotNullOnDefaultedColumns1730000000009 } from './clinic-migrations/1730000000009-SetNotNullOnDefaultedColumns';
import { ReminderSchedulerDedupe1730000000010 } from './clinic-migrations/1730000000010-ReminderSchedulerDedupe';

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
  // Explicit list (kept in sync with app.module.ts clinicConnection) — a glob
  // here would also pick up medical-DB entities and corrupt migration:generate.
  entities: [
    ClinicEntity,
    TreatmentRoomEntity,
    WorkShiftEntity,
    DoctorScheduleEntity,
    ScheduleChangeEntity,
    DoctorLeaveEntity,
    AppointmentEntity,
    AppointmentStatusHistoryEntity,
    IdempotencyKeyEntity,
    AppointmentReminderPreferenceEntity,
    AppointmentNotificationLogEntity,
    DoctorSpecialtyEntity,
    ServiceCategoryEntity,
    ServiceEntity,
    ClinicServiceEntity,
    SpecialtyEntity,
    DiagnosticOrderEntity,
  ],
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
    SetNotNullOnDefaultedColumns1730000000009,
    ReminderSchedulerDedupe1730000000010,
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
