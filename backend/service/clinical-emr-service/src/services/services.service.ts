import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { ServiceEntity } from './entities/service.entity';
import { ClinicServiceEntity } from './entities/clinic-service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity, 'clinicConnection')
    private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(ClinicServiceEntity, 'clinicConnection')
    private readonly clinicServiceRepository: Repository<ClinicServiceEntity>,
  ) {}

  // ── Service CRUD ──

  async create(dto: CreateServiceDto): Promise<ServiceEntity> {
    const service = this.serviceRepository.create(dto);
    return this.serviceRepository.save(service);
  }

  async findAll(
    query: QueryServiceDto,
  ): Promise<{ data: ServiceEntity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ServiceEntity> = {};

    if (query.service_name) {
      where.service_name = ILike(`%${query.service_name}%`);
    }
    if (query.category_id) {
      where.category_id = query.category_id;
    }
    if (query.specialty_id) {
      where.specialty_id = query.specialty_id;
    }
    if (query.is_active !== undefined) {
      where.is_active = query.is_active;
    }

    const [data, total] = await this.serviceRepository.findAndCount({
      where,
      relations: ['category', 'specialty'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<NullableType<ServiceEntity>> {
    return this.serviceRepository.findOne({
      where: { service_id: id },
      relations: ['category', 'specialty'],
    });
  }

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceEntity> {
    const service = await this.findById(id);
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    Object.assign(service, dto);
    return this.serviceRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findById(id);
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    await this.serviceRepository.delete({ service_id: id });
  }

  // ── Clinic-Service pricing ──

  async assignServiceToClinic(
    clinicId: string,
    serviceId: string,
    customPrice?: number | null,
  ): Promise<ClinicServiceEntity> {
    const clinicService = this.clinicServiceRepository.create({
      clinic_id: clinicId,
      service_id: serviceId,
      custom_price: customPrice ?? null,
    });
    return this.clinicServiceRepository.save(clinicService);
  }

  async findClinicServices(clinicId: string): Promise<ClinicServiceEntity[]> {
    return this.clinicServiceRepository.find({
      where: { clinic_id: clinicId, is_available: true },
      relations: ['service', 'service.category', 'service.specialty'],
    });
  }

  async updateClinicService(
    clinicServiceId: string,
    data: Partial<ClinicServiceEntity>,
  ): Promise<ClinicServiceEntity> {
    const cs = await this.clinicServiceRepository.findOne({
      where: { clinic_service_id: clinicServiceId },
    });
    if (!cs) {
      throw new NotFoundException(
        `Clinic-service with ID ${clinicServiceId} not found`,
      );
    }
    Object.assign(cs, data);
    return this.clinicServiceRepository.save(cs);
  }

  async removeClinicService(clinicServiceId: string): Promise<void> {
    await this.clinicServiceRepository.delete({
      clinic_service_id: clinicServiceId,
    });
  }
}
