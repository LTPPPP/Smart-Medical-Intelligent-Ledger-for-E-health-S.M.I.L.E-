import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordEntity } from './entities/medical-record.entity';
import { MedicalRecordVersionEntity } from './entities/medical-record-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalRecordEntity, MedicalRecordVersionEntity]),
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
