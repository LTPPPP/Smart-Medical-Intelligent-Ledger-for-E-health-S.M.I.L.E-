import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentPlansService } from './treatment-plans.service';
import { TreatmentPlansController } from './treatment-plans.controller';
import { TreatmentPlanEntity } from './entities/treatment-plan.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';
import { PatientRepresentativesModule } from '../patient-representatives/patient-representatives.module';

@Module({
  imports: [
    PatientRepresentativesModule,
    TypeOrmModule.forFeature([TreatmentPlanEntity, ExaminationSessionEntity]),
  ],
  controllers: [TreatmentPlansController],
  providers: [TreatmentPlansService],
  exports: [TreatmentPlansService],
})
export class TreatmentPlansModule {}
