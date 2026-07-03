import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordExportsService } from './record-exports.service';
import { RecordExportsController } from './record-exports.controller';
import { RecordExportEntity } from './entities/record-export.entity';
import { MedicalRecordEntity } from '../medical-records/entities/medical-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecordExportEntity, MedicalRecordEntity]),
  ],
  controllers: [RecordExportsController],
  providers: [RecordExportsService],
  exports: [RecordExportsService],
})
export class RecordExportsModule {}
