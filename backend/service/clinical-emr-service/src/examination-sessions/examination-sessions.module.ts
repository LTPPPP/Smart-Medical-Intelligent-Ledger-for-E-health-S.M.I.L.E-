import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExaminationSessionsService } from './examination-sessions.service';
import { ExaminationSessionsController } from './examination-sessions.controller';
import { ExaminationSessionEntity } from './entities/examination-session.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { AppointmentStatusHistoryEntity } from '../appointments/entities/appointment-status-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExaminationSessionEntity]),
    TypeOrmModule.forFeature(
      [AppointmentEntity, AppointmentStatusHistoryEntity],
      'clinicConnection',
    ),
  ],
  controllers: [ExaminationSessionsController],
  providers: [ExaminationSessionsService],
  exports: [ExaminationSessionsService],
})
export class ExaminationSessionsModule {}
