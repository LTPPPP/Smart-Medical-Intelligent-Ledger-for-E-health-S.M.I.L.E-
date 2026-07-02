import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExaminationSessionsService } from './examination-sessions.service';
import { ExaminationSessionsController } from './examination-sessions.controller';
import { ExaminationSessionEntity } from './entities/examination-session.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { AppointmentStatusHistoryEntity } from '../appointments/entities/appointment-status-history.entity';
import { DiagnosisEntity } from '../diagnoses/entities/diagnosis.entity';
import { MedicalRecordsModule } from '../medical-records/medical-records.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExaminationSessionEntity, DiagnosisEntity]),
    TypeOrmModule.forFeature(
      [AppointmentEntity, AppointmentStatusHistoryEntity],
      'clinicConnection',
    ),
    MedicalRecordsModule,
  ],
  controllers: [ExaminationSessionsController],
  providers: [ExaminationSessionsService],
  exports: [ExaminationSessionsService],
})
export class ExaminationSessionsModule {}
