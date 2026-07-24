import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { DoctorScheduleEntity } from '../doctor-schedules/entities/doctor-schedule.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';
import { TreatmentPlanEntity } from '../treatment-plans/entities/treatment-plan.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { ClinicEntity } from '../clinics/entities/clinic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [AppointmentEntity, DoctorScheduleEntity, ServiceEntity, ClinicEntity],
      'clinicConnection',
    ),
    TypeOrmModule.forFeature([ExaminationSessionEntity, TreatmentPlanEntity]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
