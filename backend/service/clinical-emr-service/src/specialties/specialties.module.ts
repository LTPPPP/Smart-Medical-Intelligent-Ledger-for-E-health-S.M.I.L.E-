import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecialtiesController } from './specialties.controller';
import { SpecialtiesService } from './specialties.service';
import { SpecialtyEntity } from './entities/specialty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SpecialtyEntity], 'clinicConnection')],
  controllers: [SpecialtiesController],
  providers: [SpecialtiesService],
  exports: [SpecialtiesService],
})
export class SpecialtiesModule {}
