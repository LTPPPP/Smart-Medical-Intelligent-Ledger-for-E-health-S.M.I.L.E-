import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalOrdersService } from './clinical-orders.service';
import { ClinicalOrdersController } from './clinical-orders.controller';
import { ClinicalOrderEntity } from './entities/clinical-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalOrderEntity])],
  controllers: [ClinicalOrdersController],
  providers: [ClinicalOrdersService],
  exports: [ClinicalOrdersService],
})
export class ClinicalOrdersModule {}
