import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentEntity } from './entities/appointment.entity';
import { AppointmentStatusHistoryEntity } from './entities/appointment-status-history.entity';
import { IdempotencyKeyEntity } from './entities/idempotency-key.entity';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { DoctorSpecialtyEntity } from '../doctor-specialties/entities/doctor-specialty.entity';
import { DoctorScheduleEntity } from '../doctor-schedules/entities/doctor-schedule.entity';
import { AppointmentNotificationPublisher } from './appointment-notification.publisher';
import { KycEligibilityClient } from './kyc-eligibility.client';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        AppointmentEntity,
        AppointmentStatusHistoryEntity,
        IdempotencyKeyEntity,
        DoctorSpecialtyEntity,
        DoctorScheduleEntity,
      ],
      'clinicConnection',
    ),
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    IdempotencyInterceptor,
    AppointmentNotificationPublisher,
    KycEligibilityClient,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
