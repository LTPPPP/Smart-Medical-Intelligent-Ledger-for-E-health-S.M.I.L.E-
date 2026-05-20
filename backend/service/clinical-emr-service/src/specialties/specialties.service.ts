import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecialtyEntity } from './entities/specialty.entity';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(SpecialtyEntity, 'clinicConnection')
    private readonly specialtyRepository: Repository<SpecialtyEntity>,
  ) {}

  async create(dto: CreateSpecialtyDto): Promise<SpecialtyEntity> {
    const specialty = this.specialtyRepository.create(dto);
    return this.specialtyRepository.save(specialty);
  }

  async findAll(activeOnly: boolean = false): Promise<SpecialtyEntity[]> {
    const where = activeOnly ? { is_active: true } : {};
    return this.specialtyRepository.find({
      where,
      order: { display_order: 'ASC', created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<NullableType<SpecialtyEntity>> {
    return this.specialtyRepository.findOne({
      where: { specialty_id: id },
    });
  }

  async update(id: string, dto: UpdateSpecialtyDto): Promise<SpecialtyEntity> {
    const specialty = await this.findById(id);
    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }
    Object.assign(specialty, dto);
    return this.specialtyRepository.save(specialty);
  }

  async remove(id: string): Promise<void> {
    const specialty = await this.findById(id);
    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }
    await this.specialtyRepository.delete({ specialty_id: id });
  }
}
