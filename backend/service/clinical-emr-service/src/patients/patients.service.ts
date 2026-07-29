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

  async create(createPatientDto: CreatePatientDto): Promise<PatientEntity> {
    const patient = this.patientsRepository.create(createPatientDto);
    return this.patientsRepository.save(patient);
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

  // Self-service provisioning for a PATIENT-role account that has no directory
  // row yet (e.g. just registered / signed up via Google) — idempotent so a
  // retry from the booking wizard never creates a duplicate.
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
}
