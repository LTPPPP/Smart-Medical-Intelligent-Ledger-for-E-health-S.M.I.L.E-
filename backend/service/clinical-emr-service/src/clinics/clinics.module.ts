import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';
import { ClinicEntity } from './entities/clinic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicEntity], 'clinicConnection')],
  controllers: [ClinicsController],
  providers: [ClinicsService],
  exports: [ClinicsService],
})
export class ClinicsModule {}
