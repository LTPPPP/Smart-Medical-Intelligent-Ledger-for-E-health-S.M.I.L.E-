import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageAnnotationsService } from './image-annotations.service';
import { ImageAnnotationsController } from './image-annotations.controller';
import { ImageAnnotationEntity } from './entities/image-annotation.entity';
import { DentalImageEntity } from '../dental-images/entities/dental-image.entity';
import { MedicalRecordEntity } from '../medical-records/entities/medical-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImageAnnotationEntity,
      DentalImageEntity,
      MedicalRecordEntity,
    ]),
  ],
  controllers: [ImageAnnotationsController],
  providers: [ImageAnnotationsService],
  exports: [ImageAnnotationsService],
})
export class ImageAnnotationsModule {}
