import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
} from 'typeorm';
import { DoctorLeaveEntity } from './entities/doctor-leave.entity';
import { CreateDoctorLeaveDto } from './dto/create-doctor-leave.dto';
import { UpdateDoctorLeaveDto } from './dto/update-doctor-leave.dto';
import { QueryDoctorLeaveDto } from './dto/query-doctor-leave.dto';
import { NullableType } from '../utils/types/nullable.type';
import { ApprovalStatus } from '../utils/enums/approval-status.enum';

@Injectable()
export class DoctorLeavesService {
  private readonly terminalStatuses = [
    ApprovalStatus.APPROVED,
    ApprovalStatus.REJECTED,
  ];

  constructor(
    @InjectRepository(DoctorLeaveEntity, 'clinicConnection')
    private readonly leaveRepository: Repository<DoctorLeaveEntity>,
  ) {}

  // Create Leave Request
  async create(dto: CreateDoctorLeaveDto): Promise<DoctorLeaveEntity> {
    if (new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new BadRequestException('end_date must be after start_date');
    }
    await this.assertNoOverlappingLeave(dto);

    const leave = this.leaveRepository.create({
      ...dto,
      start_date: new Date(dto.start_date),
      end_date: new Date(dto.end_date),
      status: ApprovalStatus.PENDING,
    });
    return this.leaveRepository.save(leave);
  }

  // List Leaves
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

  // Approve Reject Leave
  async update(
    id: string,
    dto: UpdateDoctorLeaveDto,
  ): Promise<DoctorLeaveEntity> {
    const leave = await this.findById(id);
    if (!leave) {
      throw new NotFoundException(`Leave with ID ${id} not found`);
    }
    this.assertLeaveMutable(leave);
    this.assertApprovalActor(dto, leave);

    Object.assign(leave, dto);
    return this.leaveRepository.save(leave);
  }

  // By Doctor
  async findByDoctor(
    doctorId: string,
    status?: ApprovalStatus,
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
    this.assertLeaveMutable(leave);
    await this.leaveRepository.remove(leave);
  }

  private async assertNoOverlappingLeave(
    dto: CreateDoctorLeaveDto,
  ): Promise<void> {
    const overlappingLeave = await this.leaveRepository.findOne({
      where: {
        doctor_id: dto.doctor_id,
        status: In([ApprovalStatus.PENDING, ApprovalStatus.APPROVED]) as any,
        start_date: LessThanOrEqual(new Date(dto.end_date)) as any,
        end_date: MoreThanOrEqual(new Date(dto.start_date)) as any,
      },
    });
    if (overlappingLeave) {
      throw new ConflictException(
        'Doctor already has a pending or approved leave in this date range',
      );
    }
  }

  private assertLeaveMutable(leave: DoctorLeaveEntity): void {
    if (this.terminalStatuses.includes(leave.status as ApprovalStatus)) {
      throw new ConflictException(
        'Approved or rejected leave requests cannot be changed',
      );
    }
  }

  private assertApprovalActor(
    dto: UpdateDoctorLeaveDto,
    leave: DoctorLeaveEntity,
  ): void {
    if (
      dto.status &&
      this.terminalStatuses.includes(dto.status as ApprovalStatus) &&
      !dto.approved_by &&
      !leave.approved_by
    ) {
      throw new BadRequestException(
        'approved_by is required to approve or reject a leave request',
      );
    }
  }
}
