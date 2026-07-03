import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabTestResultsService } from './lab-test-results.service';
import { LabTestResultsController } from './lab-test-results.controller';
import { LabTestResultEntity } from './entities/lab-test-result.entity';
import { ClinicalOrderEntity } from '../clinical-orders/entities/clinical-order.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LabTestResultEntity,
      ClinicalOrderEntity,
      ExaminationSessionEntity,
    ]),
  ],
  controllers: [LabTestResultsController],
  providers: [LabTestResultsService],
  exports: [LabTestResultsService],
})
export class LabTestResultsModule {}
