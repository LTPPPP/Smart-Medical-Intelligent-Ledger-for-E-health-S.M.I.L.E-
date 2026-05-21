import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import databaseConfig from './database/config/database.config';
import appConfig from './config/app.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { HealthModule } from './health/health.module';
import { ClinicsModule } from './clinics/clinics.module';
import { TreatmentRoomsModule } from './treatment-rooms/treatment-rooms.module';
import { WorkShiftsModule } from './work-shifts/work-shifts.module';
import { DoctorSchedulesModule } from './doctor-schedules/doctor-schedules.module';
import { DoctorLeavesModule } from './doctor-leaves/doctor-leaves.module';
import { ExaminationSessionsModule } from './examination-sessions/examination-sessions.module';
import { ClinicEntity } from './clinics/entities/clinic.entity';
import { TreatmentRoomEntity } from './treatment-rooms/entities/treatment-room.entity';
import { WorkShiftEntity } from './work-shifts/entities/work-shift.entity';
import { DoctorScheduleEntity } from './doctor-schedules/entities/doctor-schedule.entity';
import { ScheduleChangeEntity } from './doctor-schedules/entities/schedule-change.entity';
import { DoctorLeaveEntity } from './doctor-leaves/entities/doctor-leave.entity';

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
      ],
    }),

    // Core clinic management
    ClinicsModule,
    TreatmentRoomsModule,

    // Schedule management (UC-030 ~ UC-036)
    WorkShiftsModule,
    DoctorSchedulesModule,
    DoctorLeavesModule,

    // Examination sessions
    ExaminationSessionsModule,

    HealthModule,
  ],
})
export class AppModule {}
