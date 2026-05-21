import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabTestResultsService } from './lab-test-results.service';
import { LabTestResultsController } from './lab-test-results.controller';
import { LabTestResultEntity } from './entities/lab-test-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LabTestResultEntity])],
  controllers: [LabTestResultsController],
  providers: [LabTestResultsService],
  exports: [LabTestResultsService],
})
export class LabTestResultsModule {}
