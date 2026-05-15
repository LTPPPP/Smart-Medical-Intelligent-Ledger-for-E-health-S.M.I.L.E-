import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DentalChartsService } from './dental-charts.service';
import { DentalChartsController } from './dental-charts.controller';
import { DentalChartEntity } from './entities/dental-chart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DentalChartEntity])],
  controllers: [DentalChartsController],
  providers: [DentalChartsService],
  exports: [DentalChartsService],
})
export class DentalChartsModule {}
