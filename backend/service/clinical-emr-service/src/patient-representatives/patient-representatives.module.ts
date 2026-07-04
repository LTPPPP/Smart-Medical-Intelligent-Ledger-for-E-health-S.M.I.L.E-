import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientRepresentativesController } from './patient-representatives.controller';
import { PatientRepresentativesService } from './patient-representatives.service';
import { PatientRepresentativeEntity } from './entities/patient-representative.entity';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [TypeOrmModule.forFeature([PatientRepresentativeEntity]), PatientsModule],
  controllers: [PatientRepresentativesController],
  providers: [PatientRepresentativesService],
  exports: [PatientRepresentativesService],
})
export class PatientRepresentativesModule {}
