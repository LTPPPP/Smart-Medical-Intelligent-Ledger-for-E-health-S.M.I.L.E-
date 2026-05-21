import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordExportsService } from './record-exports.service';
import { RecordExportsController } from './record-exports.controller';
import { RecordExportEntity } from './entities/record-export.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RecordExportEntity])],
  controllers: [RecordExportsController],
  providers: [RecordExportsService],
  exports: [RecordExportsService],
})
export class RecordExportsModule {}
