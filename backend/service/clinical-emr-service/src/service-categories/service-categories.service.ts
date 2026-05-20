import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ServiceCategoryEntity } from './entities/service-category.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class ServiceCategoriesService {
  constructor(
    @InjectRepository(ServiceCategoryEntity, 'clinicConnection')
    private readonly categoryRepository: Repository<ServiceCategoryEntity>,
  ) {}

  async create(dto: CreateServiceCategoryDto): Promise<ServiceCategoryEntity> {
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<ServiceCategoryEntity[]> {
    return this.categoryRepository.find({
      relations: ['children'],
      order: { display_order: 'ASC', created_at: 'DESC' },
    });
  }

  async findRoots(): Promise<ServiceCategoryEntity[]> {
    return this.categoryRepository.find({
      where: { parent_category_id: IsNull() },
      relations: ['children'],
      order: { display_order: 'ASC' },
    });
  }

  async findById(id: string): Promise<NullableType<ServiceCategoryEntity>> {
    return this.categoryRepository.findOne({
      where: { category_id: id },
      relations: ['children', 'parent'],
    });
  }

  async update(
    id: string,
    dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryEntity> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException(`Service category with ID ${id} not found`);
    }
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException(`Service category with ID ${id} not found`);
    }
    await this.categoryRepository.delete({ category_id: id });
  }
}
