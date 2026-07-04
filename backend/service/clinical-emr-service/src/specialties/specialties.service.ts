import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecialtyEntity } from './entities/specialty.entity';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { NullableType } from '../utils/types/nullable.type';
import { RedisCacheService } from '../redis/redis-cache.service';

const CACHE_KEY_ALL = 'specialties:list:all';
const CACHE_KEY_ACTIVE = 'specialties:list:active';
const cacheKeyById = (id: string) => `specialties:id:${id}`;

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(SpecialtyEntity, 'clinicConnection')
    private readonly specialtyRepository: Repository<SpecialtyEntity>,
    private readonly cache: RedisCacheService,
  ) {}

  async create(dto: CreateSpecialtyDto): Promise<SpecialtyEntity> {
    const specialty = this.specialtyRepository.create(dto);
    const saved = await this.specialtyRepository.save(specialty);
    await this.cache.invalidate(CACHE_KEY_ALL, CACHE_KEY_ACTIVE);
    return saved;
  }

  async findAll(activeOnly: boolean = false): Promise<SpecialtyEntity[]> {
    return this.cache.wrap(
      activeOnly ? CACHE_KEY_ACTIVE : CACHE_KEY_ALL,
      () => {
        const where = activeOnly ? { is_active: true } : {};
        return this.specialtyRepository.find({
          where,
          order: { display_order: 'ASC', created_at: 'DESC' },
        });
      },
    );
  }

  async findById(id: string): Promise<NullableType<SpecialtyEntity>> {
    return this.cache.wrap(cacheKeyById(id), () =>
      this.specialtyRepository.findOne({
        where: { specialty_id: id },
      }),
    );
  }

  async update(id: string, dto: UpdateSpecialtyDto): Promise<SpecialtyEntity> {
    const specialty = await this.specialtyRepository.findOne({
      where: { specialty_id: id },
    });
    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }
    Object.assign(specialty, dto);
    const saved = await this.specialtyRepository.save(specialty);
    await this.cache.invalidate(
      CACHE_KEY_ALL,
      CACHE_KEY_ACTIVE,
      cacheKeyById(id),
    );
    return saved;
  }

  async remove(id: string): Promise<void> {
    const specialty = await this.specialtyRepository.findOne({
      where: { specialty_id: id },
    });
    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }
    await this.specialtyRepository.delete({ specialty_id: id });
    await this.cache.invalidate(
      CACHE_KEY_ALL,
      CACHE_KEY_ACTIVE,
      cacheKeyById(id),
    );
  }
}
