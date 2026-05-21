import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosisEntity } from './entities/diagnosis.entity';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';

@Injectable()
export class DiagnosesService {
  constructor(
    @InjectRepository(DiagnosisEntity)
    private diagnosesRepository: Repository<DiagnosisEntity>,
  ) {}

  async create(
    createDiagnosisDto: CreateDiagnosisDto,
  ): Promise<DiagnosisEntity> {
    const diagnosis = this.diagnosesRepository.create(createDiagnosisDto);
    return this.diagnosesRepository.save(diagnosis);
  }

  async findAll(): Promise<DiagnosisEntity[]> {
    return this.diagnosesRepository.find();
  }

  async findOne(diagnosis_id: string): Promise<DiagnosisEntity> {
    const diagnosis = await this.diagnosesRepository.findOne({
      where: { diagnosis_id },
    });
    if (!diagnosis) {
      throw new NotFoundException(
        `Diagnosis with ID ${diagnosis_id} not found`,
      );
    }
    return diagnosis;
  }

  async findBySessionId(session_id: string): Promise<DiagnosisEntity[]> {
    return this.diagnosesRepository.find({
      where: { session_id },
    });
  }

  async findByIcdCode(icd_code: string): Promise<DiagnosisEntity[]> {
    return this.diagnosesRepository.find({
      where: { icd_code },
    });
  }

  async update(
    diagnosis_id: string,
    updateDiagnosisDto: UpdateDiagnosisDto,
  ): Promise<DiagnosisEntity> {
    const diagnosis = await this.findOne(diagnosis_id);
    Object.assign(diagnosis, updateDiagnosisDto);
    return this.diagnosesRepository.save(diagnosis);
  }

  async remove(diagnosis_id: string): Promise<void> {
    const diagnosis = await this.findOne(diagnosis_id);
    await this.diagnosesRepository.remove(diagnosis);
  }
}
