import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionEntity } from './entities/prescription.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';
import { PrescriptionItemEntity } from '../prescription-items/entities/prescription-item.entity';
import { PatientRepresentativesModule } from '../patient-representatives/patient-representatives.module';

@Module({
  imports: [
    PatientRepresentativesModule,
    TypeOrmModule.forFeature([
      PrescriptionEntity,
      ExaminationSessionEntity,
      PrescriptionItemEntity,
    ]),
  ],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
