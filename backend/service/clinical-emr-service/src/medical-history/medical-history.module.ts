import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalHistoryService } from './medical-history.service';
import { MedicalHistoryController } from './medical-history.controller';
import { MedicalHistoryEntity } from './entities/medical-history.entity';
import { PatientEntity } from '../patients/entities/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalHistoryEntity, PatientEntity])],
  controllers: [MedicalHistoryController],
  providers: [MedicalHistoryService],
  exports: [MedicalHistoryService],
})
export class MedicalHistoryModule {}
