import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorSpecialtiesController } from './doctor-specialties.controller';
import { DoctorSpecialtiesService } from './doctor-specialties.service';
import { DoctorSpecialtyEntity } from './entities/doctor-specialty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorSpecialtyEntity], 'clinicConnection')],
  controllers: [DoctorSpecialtiesController],
  providers: [DoctorSpecialtiesService],
  exports: [DoctorSpecialtiesService],
})
export class DoctorSpecialtiesModule {}
