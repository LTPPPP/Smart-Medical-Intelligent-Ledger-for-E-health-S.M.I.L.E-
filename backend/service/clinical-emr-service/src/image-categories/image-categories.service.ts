import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageCategoryEntity } from './entities/image-category.entity';
import { CreateImageCategoryDto } from './dto/create-image-category.dto';
import { UpdateImageCategoryDto } from './dto/update-image-category.dto';

@Injectable()
export class ImageCategoriesService {
  constructor(
    @InjectRepository(ImageCategoryEntity)
    private imageCategoriesRepository: Repository<ImageCategoryEntity>,
  ) {}

  async create(
    createImageCategoryDto: CreateImageCategoryDto,
  ): Promise<ImageCategoryEntity> {
    const imageCategory =
      this.imageCategoriesRepository.create(createImageCategoryDto);
    return this.imageCategoriesRepository.save(imageCategory);
  }

  async findAll(): Promise<ImageCategoryEntity[]> {
    return this.imageCategoriesRepository.find();
  }

  async findOne(category_id: string): Promise<ImageCategoryEntity> {
    const imageCategory = await this.imageCategoriesRepository.findOne({
      where: { category_id },
    });
    if (!imageCategory) {
      throw new NotFoundException(
        `Image category with ID ${category_id} not found`,
      );
    }
    return imageCategory;
  }

  async findByName(category_name: string): Promise<ImageCategoryEntity[]> {
    return this.imageCategoriesRepository.find({
      where: { category_name },
    });
  }

  async update(
    category_id: string,
    updateImageCategoryDto: UpdateImageCategoryDto,
  ): Promise<ImageCategoryEntity> {
    const imageCategory = await this.findOne(category_id);
    Object.assign(imageCategory, updateImageCategoryDto);
    return this.imageCategoriesRepository.save(imageCategory);
  }

  async remove(category_id: string): Promise<void> {
    const imageCategory = await this.findOne(category_id);
    await this.imageCategoriesRepository.remove(imageCategory);
  }
}
