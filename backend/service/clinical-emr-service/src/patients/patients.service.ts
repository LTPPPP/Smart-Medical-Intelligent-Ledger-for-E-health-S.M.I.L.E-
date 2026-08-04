import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientEntity } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreateMyPatientDto } from './dto/create-my-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientEntity)
    private patientsRepository: Repository<PatientEntity>,
  ) {}

  private generatePatientCode(): string {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `PT-${rand}`;
  }

  async create(createPatientDto: CreatePatientDto): Promise<PatientEntity> {
    // Auto Generate Code
    for (let attempt = 0; attempt < 3; attempt++) {
      const patient = this.patientsRepository.create({
        ...createPatientDto,
        patient_code:
          createPatientDto.patient_code || this.generatePatientCode(),
      });
      try {
        return await this.patientsRepository.save(patient);
      } catch (error) {
        const isDuplicateCode =
          !createPatientDto.patient_code &&
          (error as { code?: string })?.code === '23505';
        if (!isDuplicateCode || attempt === 2) throw error;
      }
    }
    throw new Error('Failed to generate a unique patient code.');
  }

  async findAll(): Promise<PatientEntity[]> {
    return this.patientsRepository.find();
  }

  async findOne(patient_id: string): Promise<PatientEntity> {
    const patient = await this.patientsRepository.findOne({
      where: { patient_id },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patient_id} not found`);
    }
    return patient;
  }

  async findByUserId(userId: string): Promise<PatientEntity | null> {
    return this.patientsRepository.findOne({
      where: { user_id: userId },
    });
  }

  // Self Service Provision
  async createForSelf(
    userId: string,
    dto: CreateMyPatientDto,
  ): Promise<PatientEntity> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    const patient = this.patientsRepository.create({
      ...dto,
      user_id: userId,
      patient_code: `PT-SELF-${userId.slice(0, 8).toUpperCase()}`,
    });
    return this.patientsRepository.save(patient);
  }

  async findByCode(patient_code: string): Promise<PatientEntity> {
    const patient = await this.patientsRepository.findOne({
      where: { patient_code },
    });
    if (!patient) {
      throw new NotFoundException(
        `Patient with code ${patient_code} not found`,
      );
    }
    return patient;
  }

  async update(
    patient_id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<PatientEntity> {
    const patient = await this.findOne(patient_id);
    Object.assign(patient, updatePatientDto);
    return this.patientsRepository.save(patient);
  }

  async remove(patient_id: string): Promise<void> {
    const patient = await this.findOne(patient_id);
    await this.patientsRepository.remove(patient);
  }

  // Block Booking
  async blockBooking(
    patient_id: string,
    reason: string,
  ): Promise<PatientEntity> {
    const patient = await this.findOne(patient_id);
    patient.booking_blocked = true;
    patient.booking_blocked_reason = reason;
    patient.booking_blocked_at = new Date();
    return this.patientsRepository.save(patient);
  }

  // Manual Unblock Override
  async unblockBooking(patient_id: string): Promise<PatientEntity> {
    const patient = await this.findOne(patient_id);
    patient.booking_blocked = false;
    patient.booking_blocked_reason = null;
    patient.booking_blocked_at = null;
    return this.patientsRepository.save(patient);
  }
}
