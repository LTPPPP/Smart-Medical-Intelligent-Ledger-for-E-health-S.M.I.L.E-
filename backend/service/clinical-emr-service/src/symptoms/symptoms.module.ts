import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SymptomsService } from './symptoms.service';
import { SymptomsController } from './symptoms.controller';
import { SymptomEntity } from './entities/symptom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SymptomEntity])],
  controllers: [SymptomsController],
  providers: [SymptomsService],
  exports: [SymptomsService],
})
export class SymptomsModule {}
