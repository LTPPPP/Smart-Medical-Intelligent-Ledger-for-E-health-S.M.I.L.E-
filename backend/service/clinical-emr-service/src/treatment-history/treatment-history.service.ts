import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentHistoryEntity } from './entities/treatment-history.entity';
import { CreateTreatmentHistoryDto } from './dto/create-treatment-history.dto';
import { UpdateTreatmentHistoryDto } from './dto/update-treatment-history.dto';

@Injectable()
export class TreatmentHistoryService {
  constructor(
    @InjectRepository(TreatmentHistoryEntity)
    private treatmentHistoryRepository: Repository<TreatmentHistoryEntity>,
  ) {}

  async create(
    createTreatmentHistoryDto: CreateTreatmentHistoryDto,
  ): Promise<TreatmentHistoryEntity> {
    const treatmentHistory = this.treatmentHistoryRepository.create(
      createTreatmentHistoryDto,
    );
    return this.treatmentHistoryRepository.save(treatmentHistory);
  }

  async findAll(): Promise<TreatmentHistoryEntity[]> {
    return this.treatmentHistoryRepository.find();
  }

  async findOne(treatment_id: string): Promise<TreatmentHistoryEntity> {
    const treatmentHistory = await this.treatmentHistoryRepository.findOne({
      where: { treatment_id },
    });
    if (!treatmentHistory) {
      throw new NotFoundException(
        `Treatment history with ID ${treatment_id} not found`,
      );
    }
    return treatmentHistory;
  }

  async findByPatientId(patient_id: string): Promise<TreatmentHistoryEntity[]> {
    return this.treatmentHistoryRepository.find({
      where: { patient_id },
    });
  }

  async findByRecordId(record_id: string): Promise<TreatmentHistoryEntity[]> {
    return this.treatmentHistoryRepository.find({
      where: { record_id },
    });
  }

  async findByToothNumber(
    tooth_number: number,
  ): Promise<TreatmentHistoryEntity[]> {
    return this.treatmentHistoryRepository
      .createQueryBuilder('treatment')
      .where('treatment.tooth_numbers @> :tooth', {
        tooth: JSON.stringify([tooth_number]),
      })
      .getMany();
  }

  async update(
    treatment_id: string,
    updateTreatmentHistoryDto: UpdateTreatmentHistoryDto,
  ): Promise<TreatmentHistoryEntity> {
    const treatmentHistory = await this.findOne(treatment_id);
    Object.assign(treatmentHistory, updateTreatmentHistoryDto);
    return this.treatmentHistoryRepository.save(treatmentHistory);
  }

  async remove(treatment_id: string): Promise<void> {
    const treatmentHistory = await this.findOne(treatment_id);
    await this.treatmentHistoryRepository.remove(treatmentHistory);
  }
}
