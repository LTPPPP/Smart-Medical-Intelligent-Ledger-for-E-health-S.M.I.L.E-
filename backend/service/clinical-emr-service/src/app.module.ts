import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import databaseConfig from './database/config/database.config';
import appConfig from './config/app.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { HealthModule } from './health/health.module';
import { PatientsModule } from './patients/patients.module';
import { MedicalHistoryModule } from './medical-history/medical-history.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { TreatmentPlansModule } from './treatment-plans/treatment-plans.module';
import { RecordExportsModule } from './record-exports/record-exports.module';
import { ClinicsModule } from './clinics/clinics.module';
import { TreatmentRoomsModule } from './treatment-rooms/treatment-rooms.module';
import { WorkShiftsModule } from './work-shifts/work-shifts.module';
import { DoctorSchedulesModule } from './doctor-schedules/doctor-schedules.module';
import { DoctorLeavesModule } from './doctor-leaves/doctor-leaves.module';
import { ExaminationSessionsModule } from './examination-sessions/examination-sessions.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AgentSchedulingModule } from './agent-scheduling/agent-scheduling.module';
import { DoctorSpecialtiesModule } from './doctor-specialties/doctor-specialties.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';
import { ServicesModule } from './services/services.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { ClinicEntity } from './clinics/entities/clinic.entity';
import { TreatmentRoomEntity } from './treatment-rooms/entities/treatment-room.entity';
import { WorkShiftEntity } from './work-shifts/entities/work-shift.entity';
import { DoctorScheduleEntity } from './doctor-schedules/entities/doctor-schedule.entity';
import { ScheduleChangeEntity } from './doctor-schedules/entities/schedule-change.entity';
import { DoctorLeaveEntity } from './doctor-leaves/entities/doctor-leave.entity';
import { AppointmentEntity } from './appointments/entities/appointment.entity';
import { AppointmentStatusHistoryEntity } from './appointments/entities/appointment-status-history.entity';
import { DoctorSpecialtyEntity } from './doctor-specialties/entities/doctor-specialty.entity';
import { ServiceCategoryEntity } from './service-categories/entities/service-category.entity';
import { ServiceEntity } from './services/entities/service.entity';
import { ClinicServiceEntity } from './services/entities/clinic-service.entity';
import { SpecialtyEntity } from './specialties/entities/specialty.entity';
import { PatientEntity } from './patients/entities/patient.entity';
import { SlotEntity } from './agent-scheduling/entities/slot.entity';
import { SlotHoldEntity } from './agent-scheduling/entities/slot-hold.entity';
import { WaitlistEntryEntity } from './agent-scheduling/entities/waitlist-entry.entity';
import { EmailOutboxEntity } from './agent-scheduling/entities/email-outbox.entity';
import { HandoffTicketEntity } from './agent-scheduling/entities/handoff-ticket.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
    TypeOrmModule.forRoot({
      name: 'clinicConnection',
      type: 'postgres',
      host: process.env.CLINIC_DATABASE_HOST || process.env.DATABASE_HOST,
      port: parseInt(
        process.env.CLINIC_DATABASE_PORT || process.env.DATABASE_PORT || '5432',
        10,
      ),
      username:
        process.env.CLINIC_DATABASE_USERNAME || process.env.DATABASE_USERNAME,
      password:
        process.env.CLINIC_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD,
      database: process.env.CLINIC_DATABASE_NAME || 'core_clinic_service_db',
      synchronize: process.env.CLINIC_DATABASE_SYNCHRONIZE === 'true',
      logging: process.env.NODE_ENV !== 'production',
      entities: [
        ClinicEntity,
        TreatmentRoomEntity,
        WorkShiftEntity,
        DoctorScheduleEntity,
        ScheduleChangeEntity,
        DoctorLeaveEntity,
        AppointmentEntity,
        AppointmentStatusHistoryEntity,
        DoctorSpecialtyEntity,
        ServiceCategoryEntity,
        ServiceEntity,
        ClinicServiceEntity,
        SpecialtyEntity,
        PatientEntity,
        SlotEntity,
        SlotHoldEntity,
        WaitlistEntryEntity,
        EmailOutboxEntity,
        HandoffTicketEntity,
      ],
    }),

    // Patient management
    PatientsModule,
    MedicalHistoryModule,
    MedicalRecordsModule,
    TreatmentPlansModule,
    RecordExportsModule,

    // Core clinic management
    ClinicsModule,
    TreatmentRoomsModule,

    // Schedule management (UC-030 ~ UC-036)
    WorkShiftsModule,
    DoctorSchedulesModule,
    DoctorLeavesModule,

    // Appointment management
    AppointmentsModule,
    AgentSchedulingModule,
    DoctorSpecialtiesModule,
    ServiceCategoriesModule,
    ServicesModule,
    SpecialtiesModule,

    // Examination sessions
    ExaminationSessionsModule,

    HealthModule,
  ],
})
export class AppModule {}
