import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosisEntity } from './entities/diagnosis.entity';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';

@Injectable()
export class DiagnosesService {
  private readonly lockedSessionStatuses = ['completed', 'signed'];

  constructor(
    @InjectRepository(DiagnosisEntity)
    private diagnosesRepository: Repository<DiagnosisEntity>,
    @InjectRepository(ExaminationSessionEntity)
    private examinationSessionsRepository: Repository<ExaminationSessionEntity>,
  ) {}

  async create(
    createDiagnosisDto: CreateDiagnosisDto,
  ): Promise<DiagnosisEntity> {
    await this.assertSessionMutable(createDiagnosisDto.session_id);
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
    await this.assertSessionMutable(diagnosis.session_id);
    this.assertContextUnchanged(diagnosis, updateDiagnosisDto);
    Object.assign(diagnosis, updateDiagnosisDto);
    return this.diagnosesRepository.save(diagnosis);
  }

  async remove(diagnosis_id: string): Promise<void> {
    const diagnosis = await this.findOne(diagnosis_id);
    await this.assertSessionMutable(diagnosis.session_id);
    await this.diagnosesRepository.remove(diagnosis);
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
    diagnosis: DiagnosisEntity,
    updateDiagnosisDto: UpdateDiagnosisDto,
  ): void {
    if (
      updateDiagnosisDto.session_id !== undefined &&
      updateDiagnosisDto.session_id !== diagnosis.session_id
    ) {
      throw new BadRequestException('session_id cannot be changed');
    }
  }
}
