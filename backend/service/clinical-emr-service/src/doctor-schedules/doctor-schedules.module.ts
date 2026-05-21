import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorSchedulesController } from './doctor-schedules.controller';
import { DoctorSchedulesService } from './doctor-schedules.service';
import { DoctorScheduleEntity } from './entities/doctor-schedule.entity';
import { ScheduleChangeEntity } from './entities/schedule-change.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [DoctorScheduleEntity, ScheduleChangeEntity],
      'clinicConnection',
    ),
  ],
  controllers: [DoctorSchedulesController],
  providers: [DoctorSchedulesService],
  exports: [DoctorSchedulesService],
})
export class DoctorSchedulesModule {}
