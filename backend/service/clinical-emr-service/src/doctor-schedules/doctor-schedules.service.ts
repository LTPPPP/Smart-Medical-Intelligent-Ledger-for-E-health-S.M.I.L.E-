import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { DoctorScheduleEntity } from './entities/doctor-schedule.entity';
import { ScheduleChangeEntity } from './entities/schedule-change.entity';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import { QueryDoctorScheduleDto } from './dto/query-doctor-schedule.dto';
import { TransferScheduleDto } from './dto/transfer-schedule.dto';
import { NullableType } from '../utils/types/nullable.type';
import { ChangeType } from '../utils/enums/change-type.enum';
import { ScheduleStatus } from '../utils/enums/schedule-status.enum';
import { ApprovalStatus } from '../utils/enums/approval-status.enum';

@Injectable()
export class DoctorSchedulesService {
  private readonly lockedStatuses = [
    ScheduleStatus.COMPLETED,
    ScheduleStatus.CANCELLED,
  ];

  private readonly iamServiceUrl = (
    process.env.IAM_SERVICE_URL || 'http://localhost:3001'
  ).replace(/\/$/, '');

  constructor(
    @InjectRepository(DoctorScheduleEntity, 'clinicConnection')
    private readonly scheduleRepository: Repository<DoctorScheduleEntity>,
    @InjectRepository(ScheduleChangeEntity, 'clinicConnection')
    private readonly changeRepository: Repository<ScheduleChangeEntity>,
  ) {}

  private sendNotification(payload: {
    recipientId: string;
    subject: string;
    message: string;
    relatedEntityId: string;
    relatedEntityType: string;
  }): void {
    fetch(`${this.iamServiceUrl}/v1/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // IAM notification channel enum accepts SMS | EMAIL | PUSH | APP (not IN_APP).
      body: JSON.stringify({ ...payload, channel: 'APP' }),
    }).catch(() => {});
  }

  // UC-030: Create work schedule
  async create(dto: CreateDoctorScheduleDto): Promise<DoctorScheduleEntity> {
    if (dto.status && dto.status !== ScheduleStatus.SCHEDULED) {
      throw new BadRequestException('New schedules must start as scheduled');
    }

    // Check for duplicate (doctor + date + shift)
    if (dto.shift_id) {
      const existing = await this.scheduleRepository.findOne({
        where: {
          doctor_id: dto.doctor_id,
          work_date: new Date(dto.work_date) as any,
          shift_id: dto.shift_id,
        },
      });
      if (existing) {
        throw new ConflictException(
          'Doctor already has a schedule for this date and shift',
        );
      }
    }

    const schedule = this.scheduleRepository.create({
      ...dto,
      work_date: new Date(dto.work_date),
      status: ScheduleStatus.SCHEDULED,
    });
    const savedSchedule = await this.scheduleRepository.save(schedule);

    // UC-035/036: Notify doctor of new schedule assignment (fire-and-forget)
    this.sendNotification({
      recipientId: savedSchedule.doctor_id,
      subject: 'New Schedule Assigned',
      message: `You have been assigned a new schedule on ${new Date(savedSchedule.work_date).toISOString().split('T')[0]}.`,
      relatedEntityId: savedSchedule.schedule_id,
      relatedEntityType: 'doctor_schedule',
    });

    return savedSchedule;
  }

  // UC-030, UC-032: List schedules with filters
  async findAll(
    query: QueryDoctorScheduleDto,
  ): Promise<{ data: DoctorScheduleEntity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<DoctorScheduleEntity> = {};

    if (query.doctor_id) {
      where.doctor_id = query.doctor_id;
    }
    if (query.clinic_id) {
      where.clinic_id = query.clinic_id;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.work_date) {
      where.work_date = new Date(query.work_date) as any;
    } else if (query.date_from && query.date_to) {
      where.work_date = Between(
        new Date(query.date_from),
        new Date(query.date_to),
      ) as any;
    } else if (query.date_from) {
      where.work_date = MoreThanOrEqual(new Date(query.date_from)) as any;
    } else if (query.date_to) {
      where.work_date = LessThanOrEqual(new Date(query.date_to)) as any;
    }

    const [data, total] = await this.scheduleRepository.findAndCount({
      where,
      relations: ['clinic', 'shift', 'room'],
      skip,
      take: limit,
      order: { work_date: 'ASC', created_at: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<NullableType<DoctorScheduleEntity>> {
    return this.scheduleRepository.findOne({
      where: { schedule_id: id },
      relations: ['clinic', 'shift', 'room', 'changes'],
    });
  }

  // UC-032: Doctor's personal schedule
  async findByDoctor(
    doctorId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<DoctorScheduleEntity[]> {
    const where: FindOptionsWhere<DoctorScheduleEntity> = {
      doctor_id: doctorId,
    };

    if (dateFrom && dateTo) {
      where.work_date = Between(new Date(dateFrom), new Date(dateTo)) as any;
    } else if (dateFrom) {
      where.work_date = MoreThanOrEqual(new Date(dateFrom)) as any;
    }

    return this.scheduleRepository.find({
      where,
      relations: ['clinic', 'shift', 'room'],
      order: { work_date: 'ASC' },
    });
  }

  // UC-031: Update schedule with change log
  async update(
    id: string,
    dto: UpdateDoctorScheduleDto,
  ): Promise<DoctorScheduleEntity> {
    const schedule = await this.findById(id);
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    this.assertScheduleMutable(schedule);
    this.assertChangeActor(dto.changed_by);

    // Capture old values for audit log
    const oldValues = {
      shift_id: schedule.shift_id,
      room_id: schedule.room_id,
      max_patients: schedule.max_patients,
      status: schedule.status,
      notes: schedule.notes,
    };

    const { changed_by, change_reason, ...updateData } = dto;

    // Apply updates
    Object.assign(schedule, updateData);
    const updatedSchedule = await this.scheduleRepository.save(schedule);

    // Create change log entry (UC-031)
    const newValues = {
      shift_id: updatedSchedule.shift_id,
      room_id: updatedSchedule.room_id,
      max_patients: updatedSchedule.max_patients,
      status: updatedSchedule.status,
      notes: updatedSchedule.notes,
    };

    await this.changeRepository.save(
      this.changeRepository.create({
        schedule_id: id,
        changed_by,
        change_type: ChangeType.RESCHEDULING,
        old_values: oldValues,
        new_values: newValues,
        reason: change_reason ?? null,
      }),
    );

    // UC-035/036: Notify doctor of schedule change (fire-and-forget)
    this.sendNotification({
      recipientId: updatedSchedule.doctor_id,
      subject: 'Schedule Updated',
      message: `Your schedule on ${new Date(updatedSchedule.work_date).toISOString().split('T')[0]} has been modified.`,
      relatedEntityId: id,
      relatedEntityType: 'doctor_schedule',
    });

    return updatedSchedule;
  }

  // Get change history for a schedule
  async getChangeHistory(scheduleId: string): Promise<ScheduleChangeEntity[]> {
    return this.changeRepository.find({
      where: { schedule_id: scheduleId },
      order: { created_at: 'DESC' },
    });
  }

  // UC-035/036: Transfer a shift to another doctor with notification log
  async transferShift(
    scheduleId: string,
    dto: TransferScheduleDto,
  ): Promise<{ schedule: DoctorScheduleEntity; change: ScheduleChangeEntity }> {
    const schedule = await this.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }
    this.assertScheduleMutable(schedule);
    if (dto.to_doctor_id === schedule.doctor_id) {
      throw new BadRequestException(
        'Shift transfer target doctor must be different from the current doctor',
      );
    }

    const fromDoctorId = schedule.doctor_id;

    // Create the change/audit log entry
    const change = await this.changeRepository.save(
      this.changeRepository.create({
        schedule_id: scheduleId,
        changed_by: dto.transferred_by,
        change_type: ChangeType.SHIFT_TRANSFER,
        old_values: {
          doctor_id: fromDoctorId,
          notes: schedule.notes,
        },
        new_values: {
          doctor_id: dto.to_doctor_id,
          notes: dto.notes ?? schedule.notes,
        },
        reason: dto.reason,
        approval_status: ApprovalStatus.PENDING,
      }),
    );

    // Apply the transfer
    schedule.doctor_id = dto.to_doctor_id;
    if (dto.notes) schedule.notes = dto.notes;
    const updatedSchedule = await this.scheduleRepository.save(schedule);

    // UC-035/036: Notify both doctors of shift transfer (fire-and-forget)
    const workDate = new Date(updatedSchedule.work_date)
      .toISOString()
      .split('T')[0];
    this.sendNotification({
      recipientId: fromDoctorId,
      subject: 'Shift Transfer',
      message: `Your shift on ${workDate} has been transferred to another doctor.`,
      relatedEntityId: scheduleId,
      relatedEntityType: 'shift_transfer',
    });
    this.sendNotification({
      recipientId: dto.to_doctor_id,
      subject: 'Shift Transfer',
      message: `You have been assigned a shift on ${workDate} via transfer.`,
      relatedEntityId: scheduleId,
      relatedEntityType: 'shift_transfer',
    });

    return { schedule: updatedSchedule, change };
  }

  private assertScheduleMutable(schedule: DoctorScheduleEntity): void {
    if (this.lockedStatuses.includes(schedule.status as ScheduleStatus)) {
      throw new ConflictException(
        'Completed or cancelled schedules cannot be changed',
      );
    }
  }

  private assertChangeActor(changedBy?: string): void {
    if (!changedBy?.trim()) {
      throw new BadRequestException(
        'changed_by is required to update a schedule',
      );
    }
  }
}
