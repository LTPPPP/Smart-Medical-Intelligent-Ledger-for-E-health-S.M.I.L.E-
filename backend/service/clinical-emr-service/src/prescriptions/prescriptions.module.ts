import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionEntity } from './entities/prescription.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';
import { PrescriptionItemEntity } from '../prescription-items/entities/prescription-item.entity';

@Module({
  imports: [
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
