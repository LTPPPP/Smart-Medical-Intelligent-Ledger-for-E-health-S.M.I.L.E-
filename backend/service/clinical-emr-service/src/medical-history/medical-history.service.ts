import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalHistoryEntity } from './entities/medical-history.entity';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';

@Injectable()
export class MedicalHistoryService {
  constructor(
    @InjectRepository(MedicalHistoryEntity)
    private repository: Repository<MedicalHistoryEntity>,
  ) {}

  create(dto: CreateMedicalHistoryDto) {
    return this.repository.save(this.repository.create(dto));
  }

  findAll() {
    return this.repository.find();
  }

  findByPatient(patient_id: string) {
    return this.repository.find({ where: { patient_id } });
  }

  async findOne(history_id: string) {
    const item = await this.repository.findOne({ where: { history_id } });
    if (!item) throw new NotFoundException(`History ${history_id} not found`);
    return item;
  }

  async update(history_id: string, dto: UpdateMedicalHistoryDto) {
    const item = await this.findOne(history_id);
    if (dto.patient_id !== undefined && dto.patient_id !== item.patient_id) {
      throw new BadRequestException('patient_id cannot be changed');
    }
    Object.assign(item, dto);
    return this.repository.save(item);
  }

  async remove(history_id: string) {
    const item = await this.findOne(history_id);
    return this.repository.remove(item);
  }
}
