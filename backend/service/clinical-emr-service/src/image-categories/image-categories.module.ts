import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageCategoriesService } from './image-categories.service';
import { ImageCategoriesController } from './image-categories.controller';
import { ImageCategoryEntity } from './entities/image-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ImageCategoryEntity])],
  controllers: [ImageCategoriesController],
  providers: [ImageCategoriesService],
  exports: [ImageCategoriesService],
})
export class ImageCategoriesModule {}
