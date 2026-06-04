import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageAnnotationsService } from './image-annotations.service';
import { ImageAnnotationsController } from './image-annotations.controller';
import { ImageAnnotationEntity } from './entities/image-annotation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ImageAnnotationEntity])],
  controllers: [ImageAnnotationsController],
  providers: [ImageAnnotationsService],
  exports: [ImageAnnotationsService],
})
export class ImageAnnotationsModule {}
