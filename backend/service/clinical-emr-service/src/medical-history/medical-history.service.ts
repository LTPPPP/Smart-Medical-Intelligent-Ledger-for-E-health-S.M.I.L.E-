import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalHistoryEntity } from './entities/medical-history.entity';
import { PatientEntity } from '../patients/entities/patient.entity';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';

@Injectable()
export class MedicalHistoryService {
  constructor(
    @InjectRepository(MedicalHistoryEntity)
    private repository: Repository<MedicalHistoryEntity>,
    @InjectRepository(PatientEntity)
    private patientRepository: Repository<PatientEntity>,
  ) {}

  async create(dto: CreateMedicalHistoryDto): Promise<MedicalHistoryEntity> {
    const patient = await this.patientRepository.findOne({
      where: { patient_id: dto.patient_id },
    });
    if (!patient) {
      throw new NotFoundException(`Patient ${dto.patient_id} not found`);
    }
    return this.repository.save(this.repository.create(dto));
  }

  findByPatient(patient_id: string): Promise<MedicalHistoryEntity[]> {
    return this.repository.find({
      where: { patient_id },
      order: { diagnosed_date: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(history_id: string): Promise<MedicalHistoryEntity> {
    const item = await this.repository.findOne({ where: { history_id } });
    if (!item) throw new NotFoundException(`History ${history_id} not found`);
    return item;
  }

  async update(
    history_id: string,
    dto: UpdateMedicalHistoryDto,
  ): Promise<MedicalHistoryEntity> {
    const item = await this.findOne(history_id);
    Object.assign(item, dto);
    return this.repository.save(item);
  }

  async remove(history_id: string): Promise<void> {
    const item = await this.findOne(history_id);
    await this.repository.remove(item);
  }
}
