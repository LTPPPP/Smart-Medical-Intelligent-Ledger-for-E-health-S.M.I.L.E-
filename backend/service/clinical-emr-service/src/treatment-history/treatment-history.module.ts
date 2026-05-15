import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentHistoryService } from './treatment-history.service';
import { TreatmentHistoryController } from './treatment-history.controller';
import { TreatmentHistoryEntity } from './entities/treatment-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TreatmentHistoryEntity])],
  controllers: [TreatmentHistoryController],
  providers: [TreatmentHistoryService],
  exports: [TreatmentHistoryService],
})
export class TreatmentHistoryModule {}
