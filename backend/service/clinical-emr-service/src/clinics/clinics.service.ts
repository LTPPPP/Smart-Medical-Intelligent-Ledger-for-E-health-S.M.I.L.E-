import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { ClinicEntity } from './entities/clinic.entity';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { QueryClinicDto } from './dto/query-clinic.dto';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(ClinicEntity, 'clinicConnection')
    private readonly clinicRepository: Repository<ClinicEntity>,
  ) {}

  async findAll(
    query: QueryClinicDto,
  ): Promise<{ data: ClinicEntity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ClinicEntity> = {};

    if (query.clinic_name) {
      where.clinic_name = ILike(`%${query.clinic_name}%`);
    }
    if (query.city) {
      where.city = ILike(`%${query.city}%`);
    }
    if (query.district) {
      where.district = ILike(`%${query.district}%`);
    }
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.clinicRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<NullableType<ClinicEntity>> {
    return this.clinicRepository.findOne({
      where: { clinic_id: id },
      relations: ['treatment_rooms'],
    });
  }

  async update(id: string, dto: UpdateClinicDto): Promise<ClinicEntity> {
    const clinic = await this.findById(id);
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }

    Object.assign(clinic, {
      ...dto,
      license_expiry: dto.license_expiry
        ? new Date(dto.license_expiry)
        : clinic.license_expiry,
    });

    return this.clinicRepository.save(clinic);
  }
}
