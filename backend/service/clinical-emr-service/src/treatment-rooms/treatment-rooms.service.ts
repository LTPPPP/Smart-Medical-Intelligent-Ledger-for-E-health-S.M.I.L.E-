import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { TreatmentRoomEntity } from './entities/treatment-room.entity';
import { CreateTreatmentRoomDto } from './dto/create-treatment-room.dto';
import { UpdateTreatmentRoomDto } from './dto/update-treatment-room.dto';
import { QueryTreatmentRoomDto } from './dto/query-treatment-room.dto';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class TreatmentRoomsService {
  constructor(
    @InjectRepository(TreatmentRoomEntity, 'clinicConnection')
    private readonly roomRepository: Repository<TreatmentRoomEntity>,
  ) {}

  async create(
    clinicId: string,
    dto: CreateTreatmentRoomDto,
  ): Promise<TreatmentRoomEntity> {
    const room = this.roomRepository.create({
      ...dto,
      clinic_id: clinicId,
    });
    return this.roomRepository.save(room);
  }

  async findAllByClinic(
    clinicId: string,
    query: QueryTreatmentRoomDto,
  ): Promise<{ data: TreatmentRoomEntity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<TreatmentRoomEntity> = {
      clinic_id: clinicId,
    };

    if (query.room_type) {
      where.room_type = query.room_type;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.roomRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<NullableType<TreatmentRoomEntity>> {
    return this.roomRepository.findOne({
      where: { room_id: id },
      relations: ['clinic'],
    });
  }

  async update(
    id: string,
    dto: UpdateTreatmentRoomDto,
  ): Promise<TreatmentRoomEntity> {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException(`Treatment room with ID ${id} not found`);
    }

    Object.assign(room, dto);
    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<void> {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException(`Treatment room with ID ${id} not found`);
    }
    await this.roomRepository.delete({ room_id: id });
  }
}
