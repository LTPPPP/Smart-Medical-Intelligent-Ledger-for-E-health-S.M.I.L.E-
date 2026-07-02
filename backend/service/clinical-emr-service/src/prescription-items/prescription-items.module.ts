import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrescriptionItemsService } from './prescription-items.service';
import { PrescriptionItemsController } from './prescription-items.controller';
import { PrescriptionItemEntity } from './entities/prescription-item.entity';
import { PrescriptionEntity } from '../prescriptions/entities/prescription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrescriptionItemEntity, PrescriptionEntity])],
  controllers: [PrescriptionItemsController],
  providers: [PrescriptionItemsService],
  exports: [PrescriptionItemsService],
})
export class PrescriptionItemsModule {}
