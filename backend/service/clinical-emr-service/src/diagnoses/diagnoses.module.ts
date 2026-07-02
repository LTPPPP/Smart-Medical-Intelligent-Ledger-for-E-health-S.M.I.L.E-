import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosesService } from './diagnoses.service';
import { DiagnosesController } from './diagnoses.controller';
import { DiagnosisEntity } from './entities/diagnosis.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiagnosisEntity, ExaminationSessionEntity])],
  controllers: [DiagnosesController],
  providers: [DiagnosesService],
  exports: [DiagnosesService],
})
export class DiagnosesModule {}
