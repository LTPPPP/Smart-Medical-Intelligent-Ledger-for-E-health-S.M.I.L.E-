import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SymptomsService } from './symptoms.service';
import { SymptomsController } from './symptoms.controller';
import { SymptomEntity } from './entities/symptom.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SymptomEntity, ExaminationSessionEntity]),
  ],
  controllers: [SymptomsController],
  providers: [SymptomsService],
  exports: [SymptomsService],
})
export class SymptomsModule {}
