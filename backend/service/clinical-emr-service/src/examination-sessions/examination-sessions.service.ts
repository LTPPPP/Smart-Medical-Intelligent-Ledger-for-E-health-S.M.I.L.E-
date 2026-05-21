import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExaminationSessionEntity } from './entities/examination-session.entity';
import { CreateExaminationSessionDto } from './dto/create-examination-session.dto';
import { UpdateExaminationSessionDto } from './dto/update-examination-session.dto';

@Injectable()
export class ExaminationSessionsService {
  constructor(
    @InjectRepository(ExaminationSessionEntity)
    private examinationSessionsRepository: Repository<ExaminationSessionEntity>,
  ) {}

  async create(
    createExaminationSessionDto: CreateExaminationSessionDto,
  ): Promise<ExaminationSessionEntity> {
    const examinationSession = this.examinationSessionsRepository.create(
      createExaminationSessionDto,
    );
    return this.examinationSessionsRepository.save(examinationSession);
  }

  async findAll(): Promise<ExaminationSessionEntity[]> {
    return this.examinationSessionsRepository.find();
  }

  async findOne(session_id: string): Promise<ExaminationSessionEntity> {
    const examinationSession = await this.examinationSessionsRepository.findOne(
      {
        where: { session_id },
      },
    );
    if (!examinationSession) {
      throw new NotFoundException(
        `Examination session with ID ${session_id} not found`,
      );
    }
    return examinationSession;
  }

  async findByPatientId(
    patient_id: string,
  ): Promise<ExaminationSessionEntity[]> {
    return this.examinationSessionsRepository.find({
      where: { patient_id },
    });
  }

  async findByDoctorId(doctor_id: string): Promise<ExaminationSessionEntity[]> {
    return this.examinationSessionsRepository.find({
      where: { doctor_id },
    });
  }

  async update(
    session_id: string,
    updateExaminationSessionDto: UpdateExaminationSessionDto,
  ): Promise<ExaminationSessionEntity> {
    const examinationSession = await this.findOne(session_id);
    Object.assign(examinationSession, updateExaminationSessionDto);
    return this.examinationSessionsRepository.save(examinationSession);
  }

  async remove(session_id: string): Promise<void> {
    const examinationSession = await this.findOne(session_id);
    await this.examinationSessionsRepository.remove(examinationSession);
  }
}
