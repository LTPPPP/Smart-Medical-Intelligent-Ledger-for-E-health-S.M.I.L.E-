import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import { PatientEntity } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientQueryDto } from './dto/search-patient-query.dto';
import { PaginatedResponseDto } from '../utils/dto/api-response.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientEntity)
    private patientsRepository: Repository<PatientEntity>,
  ) {}

  private async generatePatientCode(): Promise<string> {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PAT-${datePart}-`;
    const count = await this.patientsRepository
      .createQueryBuilder('p')
      .where('p.patient_code LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  async create(createPatientDto: CreatePatientDto): Promise<PatientEntity> {
    // Duplicate email check
    if (createPatientDto.email) {
      const existing = await this.patientsRepository.findOne({
        where: { email: createPatientDto.email },
      });
      if (existing) {
        throw new ConflictException(
          `A patient with email ${createPatientDto.email} already exists`,
        );
      }
    }

    // Duplicate phone check
    if (createPatientDto.phone) {
      const existing = await this.patientsRepository.findOne({
        where: { phone: createPatientDto.phone },
      });
      if (existing) {
        throw new ConflictException(
          `A patient with phone ${createPatientDto.phone} already exists`,
        );
      }
    }

    const patient_code = await this.generatePatientCode();
    const patient = this.patientsRepository.create({
      ...createPatientDto,
      patient_code,
    });
    return this.patientsRepository.save(patient);
  }

  async findAll(
    query?: SearchPatientQueryDto,
  ): Promise<PaginatedResponseDto<PatientEntity>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.patientsRepository.createQueryBuilder('p');

    if (query?.q) {
      const term = `%${query.q}%`;
      qb.where(
        '(p.full_name ILIKE :term OR p.phone ILIKE :term OR p.email ILIKE :term OR p.patient_code ILIKE :term)',
        { term },
      );
    }
    if (query?.city) {
      qb.andWhere('p.city ILIKE :city', { city: `%${query.city}%` });
    }

    const sortField = query?.sortBy ?? 'created_at';
    const sortOrder = query?.sortOrder ?? 'DESC';
    qb.orderBy(`p.${sortField}`, sortOrder).skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
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

    // Conflict check: email uniqueness
    if (updatePatientDto.email && updatePatientDto.email !== patient.email) {
      const conflict = await this.patientsRepository.findOne({
        where: { email: updatePatientDto.email },
      });
      if (conflict) {
        throw new ConflictException(
          `Email ${updatePatientDto.email} is already used by another patient`,
        );
      }
    }

    // Conflict check: phone uniqueness
    if (updatePatientDto.phone && updatePatientDto.phone !== patient.phone) {
      const conflict = await this.patientsRepository.findOne({
        where: { phone: updatePatientDto.phone },
      });
      if (conflict) {
        throw new ConflictException(
          `Phone ${updatePatientDto.phone} is already used by another patient`,
        );
      }
    }

    Object.assign(patient, updatePatientDto);
    return this.patientsRepository.save(patient);
  }

  async remove(patient_id: string): Promise<void> {
    const patient = await this.findOne(patient_id);
    await this.patientsRepository.remove(patient);
  }
}
