import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkShiftEntity } from './entities/work-shift.entity';
import { CreateWorkShiftDto } from './dto/create-work-shift.dto';
import { UpdateWorkShiftDto } from './dto/update-work-shift.dto';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class WorkShiftsService {
  constructor(
    @InjectRepository(WorkShiftEntity, 'clinicConnection')
    private readonly shiftRepository: Repository<WorkShiftEntity>,
  ) {}

  async create(dto: CreateWorkShiftDto): Promise<WorkShiftEntity> {
    const shift = this.shiftRepository.create(dto);
    return this.shiftRepository.save(shift);
  }

  async findAll(): Promise<WorkShiftEntity[]> {
    return this.shiftRepository.find({ order: { start_time: 'ASC' } });
  }

  async findById(id: string): Promise<NullableType<WorkShiftEntity>> {
    return this.shiftRepository.findOne({ where: { shift_id: id } });
  }

  async update(id: string, dto: UpdateWorkShiftDto): Promise<WorkShiftEntity> {
    const shift = await this.findById(id);
    if (!shift) {
      throw new NotFoundException(`Work shift with ID ${id} not found`);
    }
    Object.assign(shift, dto);
    return this.shiftRepository.save(shift);
  }

  async remove(id: string): Promise<void> {
    const shift = await this.findById(id);
    if (!shift) {
      throw new NotFoundException(`Work shift with ID ${id} not found`);
    }
    await this.shiftRepository.delete({ shift_id: id });
  }
}
