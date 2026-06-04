import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorSpecialtyEntity } from './entities/doctor-specialty.entity';
import { CreateDoctorSpecialtyDto } from './dto/create-doctor-specialty.dto';

@Injectable()
export class DoctorSpecialtiesService {
  constructor(
    @InjectRepository(DoctorSpecialtyEntity, 'clinicConnection')
    private readonly dsRepository: Repository<DoctorSpecialtyEntity>,
  ) {}

  async create(dto: CreateDoctorSpecialtyDto): Promise<DoctorSpecialtyEntity> {
    const existing = await this.dsRepository.findOne({
      where: { doctor_id: dto.doctor_id, specialty_id: dto.specialty_id },
    });
    if (existing) {
      throw new ConflictException('Doctor already assigned to this specialty');
    }

    const ds = this.dsRepository.create({
      ...dto,
      certified_date: dto.certified_date ? new Date(dto.certified_date) : null,
    });
    return this.dsRepository.save(ds);
  }

  async findByDoctor(doctorId: string): Promise<DoctorSpecialtyEntity[]> {
    return this.dsRepository.find({
      where: { doctor_id: doctorId },
      relations: ['specialty'],
    });
  }

  async findBySpecialty(specialtyId: string): Promise<DoctorSpecialtyEntity[]> {
    return this.dsRepository.find({
      where: { specialty_id: specialtyId },
    });
  }

  async remove(doctorId: string, specialtyId: string): Promise<void> {
    const result = await this.dsRepository.delete({
      doctor_id: doctorId,
      specialty_id: specialtyId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Doctor-specialty assignment not found');
    }
  }
}
