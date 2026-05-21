import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { DoctorLeaveEntity } from './entities/doctor-leave.entity';
import { CreateDoctorLeaveDto } from './dto/create-doctor-leave.dto';
import { UpdateDoctorLeaveDto } from './dto/update-doctor-leave.dto';
import { QueryDoctorLeaveDto } from './dto/query-doctor-leave.dto';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class DoctorLeavesService {
  constructor(
    @InjectRepository(DoctorLeaveEntity, 'clinicConnection')
    private readonly leaveRepository: Repository<DoctorLeaveEntity>,
  ) {}

  // UC-033: Create leave request
  async create(dto: CreateDoctorLeaveDto): Promise<DoctorLeaveEntity> {
    if (new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new BadRequestException('end_date must be after start_date');
    }

    const leave = this.leaveRepository.create({
      ...dto,
      start_date: new Date(dto.start_date),
      end_date: new Date(dto.end_date),
    });
    return this.leaveRepository.save(leave);
  }

  // UC-033: List leaves with filters
  async findAll(
    query: QueryDoctorLeaveDto,
  ): Promise<{ data: DoctorLeaveEntity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<DoctorLeaveEntity> = {};

    if (query.doctor_id) {
      where.doctor_id = query.doctor_id;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.date_from && query.date_to) {
      where.start_date = Between(
        new Date(query.date_from),
        new Date(query.date_to),
      ) as any;
    } else if (query.date_from) {
      where.start_date = MoreThanOrEqual(new Date(query.date_from)) as any;
    } else if (query.date_to) {
      where.start_date = LessThanOrEqual(new Date(query.date_to)) as any;
    }

    const [data, total] = await this.leaveRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { start_date: 'ASC', created_at: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<NullableType<DoctorLeaveEntity>> {
    return this.leaveRepository.findOne({
      where: { leave_id: id },
    });
  }

  // UC-034: Approve/reject leave
  async update(
    id: string,
    dto: UpdateDoctorLeaveDto,
  ): Promise<DoctorLeaveEntity> {
    const leave = await this.findById(id);
    if (!leave) {
      throw new NotFoundException(`Leave with ID ${id} not found`);
    }

    Object.assign(leave, dto);
    return this.leaveRepository.save(leave);
  }

  // UC-033: Get leaves by doctor
  async findByDoctor(
    doctorId: string,
    status?: string,
  ): Promise<DoctorLeaveEntity[]> {
    const where: FindOptionsWhere<DoctorLeaveEntity> = {
      doctor_id: doctorId,
    };
    if (status) {
      where.status = status;
    }
    return this.leaveRepository.find({
      where,
      order: { start_date: 'ASC' },
    });
  }

  async remove(id: string): Promise<void> {
    const leave = await this.findById(id);
    if (!leave) {
      throw new NotFoundException(`Leave with ID ${id} not found`);
    }
    await this.leaveRepository.remove(leave);
  }
}
