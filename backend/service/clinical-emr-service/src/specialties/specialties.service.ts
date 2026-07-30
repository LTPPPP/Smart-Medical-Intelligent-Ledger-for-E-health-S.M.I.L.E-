import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Not, Repository } from 'typeorm';
import { SpecialtyEntity } from './entities/specialty.entity';
import { ClinicSpecialtyEntity } from './entities/clinic-specialty.entity';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { NullableType } from '../utils/types/nullable.type';
import { RedisCacheService } from '../redis/redis-cache.service';

const CACHE_KEY_ALL = 'specialties:list:all';
const CACHE_KEY_ACTIVE = 'specialties:list:active';
const cacheKeyById = (id: string) => `specialties:id:${id}`;

export type SpecialtyWithClinics = SpecialtyEntity & { clinic_ids: string[] };

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(SpecialtyEntity, 'clinicConnection')
    private readonly specialtyRepository: Repository<SpecialtyEntity>,
    @InjectRepository(ClinicSpecialtyEntity, 'clinicConnection')
    private readonly clinicSpecialtyRepository: Repository<ClinicSpecialtyEntity>,
    private readonly cache: RedisCacheService,
  ) {}

  private async assertUniqueName(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.specialtyRepository.findOne({
      where: excludeId
        ? { specialty_name: ILike(name), specialty_id: Not(excludeId) }
        : { specialty_name: ILike(name) },
    });
    if (existing) {
      throw new ConflictException(
        `A specialty named "${name}" already exists.`,
      );
    }
  }

  private async syncClinics(
    specialtyId: string,
    clinicIds: string[],
  ): Promise<void> {
    await this.clinicSpecialtyRepository.delete({ specialty_id: specialtyId });
    if (clinicIds.length) {
      await this.clinicSpecialtyRepository.insert(
        clinicIds.map((clinic_id) => ({ clinic_id, specialty_id: specialtyId })),
      );
    }
  }

  private async attachClinicIds(
    specialties: SpecialtyEntity[],
  ): Promise<SpecialtyWithClinics[]> {
    if (!specialties.length) return [];
    const links = await this.clinicSpecialtyRepository.find({
      where: { specialty_id: In(specialties.map((s) => s.specialty_id)) },
    });
    const bySpecialty = new Map<string, string[]>();
    for (const link of links) {
      const list = bySpecialty.get(link.specialty_id) ?? [];
      list.push(link.clinic_id);
      bySpecialty.set(link.specialty_id, list);
    }
    return specialties.map((s) => ({
      ...s,
      clinic_ids: bySpecialty.get(s.specialty_id) ?? [],
    }));
  }

  async create(dto: CreateSpecialtyDto): Promise<SpecialtyWithClinics> {
    await this.assertUniqueName(dto.specialty_name);
    const { clinic_ids, ...rest } = dto;
    const specialty = this.specialtyRepository.create(rest);
    const saved = await this.specialtyRepository.save(specialty);
    if (clinic_ids) {
      await this.syncClinics(saved.specialty_id, clinic_ids);
    }
    await this.cache.invalidate(CACHE_KEY_ALL, CACHE_KEY_ACTIVE);
    const [withClinics] = await this.attachClinicIds([saved]);
    return withClinics;
  }

  async findAll(
    activeOnly: boolean = false,
  ): Promise<SpecialtyWithClinics[]> {
    const specialties = await this.cache.wrap(
      activeOnly ? CACHE_KEY_ACTIVE : CACHE_KEY_ALL,
      () => {
        const where = activeOnly ? { is_active: true } : {};
        // Newest first
        return this.specialtyRepository.find({
          where,
          order: { created_at: 'DESC' },
        });
      },
    );
    return this.attachClinicIds(specialties);
  }

  async findById(id: string): Promise<NullableType<SpecialtyWithClinics>> {
    const specialty = await this.cache.wrap(cacheKeyById(id), () =>
      this.specialtyRepository.findOne({
        where: { specialty_id: id },
      }),
    );
    if (!specialty) return null;
    const [withClinics] = await this.attachClinicIds([specialty]);
    return withClinics;
  }

  async update(
    id: string,
    dto: UpdateSpecialtyDto,
  ): Promise<SpecialtyWithClinics> {
    const specialty = await this.specialtyRepository.findOne({
      where: { specialty_id: id },
    });
    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }
    if (dto.specialty_name) {
      await this.assertUniqueName(dto.specialty_name, id);
    }
    const { clinic_ids, ...rest } = dto;
    Object.assign(specialty, rest);
    const saved = await this.specialtyRepository.save(specialty);
    if (clinic_ids) {
      await this.syncClinics(id, clinic_ids);
    }
    await this.cache.invalidate(
      CACHE_KEY_ALL,
      CACHE_KEY_ACTIVE,
      cacheKeyById(id),
    );
    const [withClinics] = await this.attachClinicIds([saved]);
    return withClinics;
  }

  async remove(id: string): Promise<void> {
    const specialty = await this.specialtyRepository.findOne({
      where: { specialty_id: id },
    });
    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }
    await this.specialtyRepository.delete({ specialty_id: id });
    await this.cache.invalidate(
      CACHE_KEY_ALL,
      CACHE_KEY_ACTIVE,
      cacheKeyById(id),
    );
  }
}
