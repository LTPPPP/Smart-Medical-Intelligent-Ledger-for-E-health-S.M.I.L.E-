import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentEntity } from './entities/appointment.entity';
import { AppointmentStatusHistoryEntity } from './entities/appointment-status-history.entity';
import { IdempotencyKeyEntity } from './entities/idempotency-key.entity';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { DoctorSpecialtyEntity } from '../doctor-specialties/entities/doctor-specialty.entity';
import { DoctorScheduleEntity } from '../doctor-schedules/entities/doctor-schedule.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { TreatmentRoomEntity } from '../treatment-rooms/entities/treatment-room.entity';
import { ClinicEntity } from '../clinics/entities/clinic.entity';
import { AppointmentNotificationPublisher } from './appointment-notification.publisher';
import { KycEligibilityClient } from './kyc-eligibility.client';
import { PatientsModule } from '../patients/patients.module';
import { AppointmentAvailabilityService } from './appointment-availability.service';
import { AppointmentOptionTokenService } from './appointment-option-token.service';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';
import { TreatmentPlanEntity } from '../treatment-plans/entities/treatment-plan.entity';
import { AppointmentReminderPreferenceEntity } from './entities/appointment-reminder-preference.entity';
import { AppointmentNotificationLogEntity } from './entities/appointment-notification-log.entity';

@Module({
  imports: [
    PatientsModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature(
      [
        AppointmentEntity,
        AppointmentStatusHistoryEntity,
        IdempotencyKeyEntity,
        DoctorSpecialtyEntity,
        DoctorScheduleEntity,
        ServiceEntity,
        TreatmentRoomEntity,
        ClinicEntity,
        AppointmentReminderPreferenceEntity,
        AppointmentNotificationLogEntity,
      ],
      'clinicConnection',
    ),
    TypeOrmModule.forFeature([ExaminationSessionEntity, TreatmentPlanEntity]),
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    IdempotencyInterceptor,
    AppointmentNotificationPublisher,
    KycEligibilityClient,
    AppointmentAvailabilityService,
    AppointmentOptionTokenService,
  ],
  exports: [AppointmentsService, AppointmentAvailabilityService],
})
export class AppointmentsModule {}
