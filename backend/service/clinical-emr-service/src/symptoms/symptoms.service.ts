import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SymptomEntity } from './entities/symptom.entity';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';

@Injectable()
export class SymptomsService {
  private readonly lockedSessionStatuses = ['completed', 'signed'];

  constructor(
    @InjectRepository(SymptomEntity)
    private symptomsRepository: Repository<SymptomEntity>,
    @InjectRepository(ExaminationSessionEntity)
    private examinationSessionsRepository: Repository<ExaminationSessionEntity>,
  ) {}

  async create(createSymptomDto: CreateSymptomDto): Promise<SymptomEntity> {
    await this.assertSessionMutable(createSymptomDto.session_id);
    const symptom = this.symptomsRepository.create(createSymptomDto);
    return this.symptomsRepository.save(symptom);
  }

  async findAll(): Promise<SymptomEntity[]> {
    return this.symptomsRepository.find();
  }

  async findOne(symptom_id: string): Promise<SymptomEntity> {
    const symptom = await this.symptomsRepository.findOne({
      where: { symptom_id },
    });
    if (!symptom) {
      throw new NotFoundException(`Symptom with ID ${symptom_id} not found`);
    }
    return symptom;
  }

  async findBySessionId(session_id: string): Promise<SymptomEntity[]> {
    return this.symptomsRepository.find({
      where: { session_id },
    });
  }

  async findByPatientId(patient_id: string): Promise<SymptomEntity[]> {
    return this.symptomsRepository.find({
      where: { patient_id },
    });
  }

  async update(
    symptom_id: string,
    updateSymptomDto: UpdateSymptomDto,
  ): Promise<SymptomEntity> {
    const symptom = await this.findOne(symptom_id);
    await this.assertSessionMutable(symptom.session_id);
    this.assertContextUnchanged(symptom, updateSymptomDto);
    Object.assign(symptom, updateSymptomDto);
    return this.symptomsRepository.save(symptom);
  }

  async remove(symptom_id: string): Promise<void> {
    const symptom = await this.findOne(symptom_id);
    await this.assertSessionMutable(symptom.session_id);
    await this.symptomsRepository.remove(symptom);
  }

  private async assertSessionMutable(session_id: string): Promise<void> {
    const session = await this.examinationSessionsRepository.findOne({
      where: { session_id },
    });
    if (!session) {
      throw new NotFoundException(
        `Examination session with ID ${session_id} not found`,
      );
    }
    if (
      this.lockedSessionStatuses.includes(session.status) ||
      session.signed_at
    ) {
      throw new ConflictException(
        'Finalized examination sessions cannot be changed. Create an amendment instead.',
      );
    }
  }

  private assertContextUnchanged(
    symptom: SymptomEntity,
    updateSymptomDto: UpdateSymptomDto,
  ): void {
    const contextFields = ['session_id', 'patient_id', 'recorded_by'] as const;

    for (const field of contextFields) {
      const nextValue = updateSymptomDto[field];
      if (nextValue !== undefined && nextValue !== symptom[field]) {
        throw new BadRequestException(`${field} cannot be changed`);
      }
    }
  }
}
