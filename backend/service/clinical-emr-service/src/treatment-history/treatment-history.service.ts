import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentHistoryEntity } from './entities/treatment-history.entity';
import { CreateTreatmentHistoryDto } from './dto/create-treatment-history.dto';
import { UpdateTreatmentHistoryDto } from './dto/update-treatment-history.dto';
import { MedicalRecordEntity } from '../medical-records/entities/medical-record.entity';

@Injectable()
export class TreatmentHistoryService {
  private readonly lockedRecordStatuses = ['finalized', 'completed', 'signed'];

  constructor(
    @InjectRepository(TreatmentHistoryEntity)
    private treatmentHistoryRepository: Repository<TreatmentHistoryEntity>,
    @InjectRepository(MedicalRecordEntity)
    private medicalRecordsRepository: Repository<MedicalRecordEntity>,
  ) {}

  async create(
    createTreatmentHistoryDto: CreateTreatmentHistoryDto,
  ): Promise<TreatmentHistoryEntity> {
    const record = await this.findMutableRecord(
      createTreatmentHistoryDto.record_id,
    );
    this.assertRecordPatientContext(
      createTreatmentHistoryDto.patient_id,
      record,
    );

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
    await this.findMutableRecord(treatmentHistory.record_id);
    this.assertContextUnchanged(treatmentHistory, updateTreatmentHistoryDto);
    Object.assign(treatmentHistory, updateTreatmentHistoryDto);
    return this.treatmentHistoryRepository.save(treatmentHistory);
  }

  async remove(treatment_id: string): Promise<void> {
    const treatmentHistory = await this.findOne(treatment_id);
    await this.findMutableRecord(treatmentHistory.record_id);
    await this.treatmentHistoryRepository.remove(treatmentHistory);
  }

  private async findMutableRecord(
    record_id: string,
  ): Promise<MedicalRecordEntity> {
    const record = await this.medicalRecordsRepository.findOne({
      where: { record_id },
    });
    if (!record) {
      throw new NotFoundException(
        `Medical record with ID ${record_id} not found`,
      );
    }
    if (
      this.lockedRecordStatuses.includes(record.record_status) ||
      record.finalized_at
    ) {
      throw new ConflictException(
        'Finalized medical records cannot change treatment history. Create an amendment instead.',
      );
    }
    return record;
  }

  private assertRecordPatientContext(
    patient_id: string,
    record: MedicalRecordEntity,
  ): void {
    if (patient_id !== record.patient_id) {
      throw new BadRequestException(
        'Treatment history patient does not match medical record.',
      );
    }
  }

  private assertContextUnchanged(
    treatmentHistory: TreatmentHistoryEntity,
    updateTreatmentHistoryDto: UpdateTreatmentHistoryDto,
  ): void {
    const contextFields = ['record_id', 'patient_id', 'performed_by'] as const;

    for (const field of contextFields) {
      const nextValue = updateTreatmentHistoryDto[field];
      if (nextValue !== undefined && nextValue !== treatmentHistory[field]) {
        throw new BadRequestException(`${field} cannot be changed`);
      }
    }
  }
}
