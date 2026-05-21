import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServiceEntity } from './entities/service.entity';
import { ClinicServiceEntity } from './entities/clinic-service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [ServiceEntity, ClinicServiceEntity],
      'clinicConnection',
    ),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
