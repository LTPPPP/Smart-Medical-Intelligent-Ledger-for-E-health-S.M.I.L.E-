import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DentalImagesService } from './dental-images.service';
import { DentalImagesController } from './dental-images.controller';
import { DentalImageEntity } from './entities/dental-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DentalImageEntity])],
  controllers: [DentalImagesController],
  providers: [DentalImagesService],
  exports: [DentalImagesService],
})
export class DentalImagesModule {}
