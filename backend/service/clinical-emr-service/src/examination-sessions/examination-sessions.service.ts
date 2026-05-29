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

  /** Tính BMI tự động nếu có cân nặng và chiều cao */
  private calculateBmi(
    weight_kg?: number | null,
    height_cm?: number | null,
  ): number | null {
    if (!weight_kg || !height_cm || height_cm <= 0) return null;
    const heightM = height_cm / 100;
    return Math.round((weight_kg / (heightM * heightM)) * 100) / 100;
  }

  async create(
    createExaminationSessionDto: CreateExaminationSessionDto,
  ): Promise<ExaminationSessionEntity> {
    const dto = { ...createExaminationSessionDto };
    // Tự động tính BMI nếu chưa cung cấp
    if (!dto.bmi && dto.weight_kg && dto.height_cm) {
      dto.bmi = this.calculateBmi(dto.weight_kg, dto.height_cm) ?? undefined;
    }
    const examinationSession = this.examinationSessionsRepository.create(dto);
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
    // Tái tính BMI nếu cân nặng hoặc chiều cao được cập nhật
    if (
      (updateExaminationSessionDto.weight_kg !== undefined ||
        updateExaminationSessionDto.height_cm !== undefined) &&
      !updateExaminationSessionDto.bmi
    ) {
      examinationSession.bmi = this.calculateBmi(
        examinationSession.weight_kg,
        examinationSession.height_cm,
      );
    }
    return this.examinationSessionsRepository.save(examinationSession);
  }

  async remove(session_id: string): Promise<void> {
    const examinationSession = await this.findOne(session_id);
    await this.examinationSessionsRepository.remove(examinationSession);
  }
}
