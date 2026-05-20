import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategoryEntity } from './entities/service-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCategoryEntity], 'clinicConnection')],
  controllers: [ServiceCategoriesController],
  providers: [ServiceCategoriesService],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
