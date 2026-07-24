import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DentalChartsService } from './dental-charts.service';
import { DentalChartsController } from './dental-charts.controller';
import { DentalChartEntity } from './entities/dental-chart.entity';
import { MedicalRecordEntity } from '../medical-records/entities/medical-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DentalChartEntity, MedicalRecordEntity])],
  controllers: [DentalChartsController],
  providers: [DentalChartsService],
  exports: [DentalChartsService],
})
export class DentalChartsModule {}
