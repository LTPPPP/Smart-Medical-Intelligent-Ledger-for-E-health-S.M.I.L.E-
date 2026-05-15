import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentEntity } from './entities/appointment.entity';
import { AppointmentStatusHistoryEntity } from './entities/appointment-status-history.entity';
import { DoctorSpecialtyEntity } from '../doctor-specialties/entities/doctor-specialty.entity';
import { DoctorScheduleEntity } from '../doctor-schedules/entities/doctor-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        AppointmentEntity,
        AppointmentStatusHistoryEntity,
        DoctorSpecialtyEntity,
        DoctorScheduleEntity,
      ],
      'clinicConnection',
    ),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
