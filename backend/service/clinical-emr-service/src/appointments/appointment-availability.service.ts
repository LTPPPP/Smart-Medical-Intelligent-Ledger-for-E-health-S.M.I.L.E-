import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { AppointmentEntity } from './entities/appointment.entity';
import { DoctorScheduleEntity } from '../doctor-schedules/entities/doctor-schedule.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';
import {
  buildOccupiedInterval,
  generateCandidateStarts,
  OccupiedInterval,
} from './scheduling-policy';
import { AppointmentOptionTokenService } from './appointment-option-token.service';

export interface AvailabilityQuery {
  patient_id: string;
  service_id: string;
  date_from: string;
  date_to: string;
  clinic_id?: string;
  doctor_id?: string;
}

export interface AvailabilitySlot {
  option_token: string;
  start_time: string;
  occupied_until: string;
}

export interface AvailabilityDoctorGroup {
  doctor_id: string;
  clinic_id: string;
  room: { room_id: string; room_name: string };
  slots: AvailabilitySlot[];
}

export interface AvailabilityDateGroup {
  date: string;
  doctors: AvailabilityDoctorGroup[];
}

@Injectable()
export class AppointmentAvailabilityService {
  private readonly blockingStatuses = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.IN_PROGRESS,
  ];

  constructor(
    @InjectRepository(ServiceEntity, 'clinicConnection')
    private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(DoctorScheduleEntity, 'clinicConnection')
    private readonly scheduleRepository: Repository<DoctorScheduleEntity>,
    @InjectRepository(AppointmentEntity, 'clinicConnection')
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    private readonly optionTokens: AppointmentOptionTokenService,
  ) {}

  async findAvailability(query: AvailabilityQuery): Promise<{
    service: {
      id: string;
      name: string;
      duration_minutes: number;
      required_room_type: string;
    };
    dates: AvailabilityDateGroup[];
  }> {
    const service = await this.serviceRepository.findOne({
      where: { service_id: query.service_id, is_active: true },
    });
    if (!service) {
      throw new NotFoundException('SERVICE_NOT_FOUND');
    }
    if (!service.required_room_type) {
      throw new UnprocessableEntityException(
        'SERVICE_ROOM_TYPE_NOT_CONFIGURED',
      );
    }

    const schedules = await this.scheduleRepository.find({
      where: {
        ...(query.clinic_id ? { clinic_id: query.clinic_id } : {}),
        ...(query.doctor_id ? { doctor_id: query.doctor_id } : {}),
        work_date: Between(
          new Date(query.date_from),
          new Date(query.date_to),
        ) as any,
        status: 'scheduled',
      },
      relations: ['shift', 'room'],
      order: { work_date: 'ASC' as const },
    });

    const appointments = await this.appointmentRepository.find({
      where: {
        appointment_date: Between(
          new Date(query.date_from),
          new Date(query.date_to),
        ) as any,
        status: In(this.blockingStatuses),
      },
    });

    const dates = new Map<string, AvailabilityDateGroup>();
    for (const schedule of schedules) {
      if (!schedule.room_id || !schedule.room) {
        throw new UnprocessableEntityException(
          'DOCTOR_SCHEDULE_ROOM_REQUIRED',
        );
      }
      if (schedule.room.room_type !== service.required_room_type) {
        throw new UnprocessableEntityException('ROOM_TYPE_MISMATCH');
      }
      if (!schedule.shift) {
        throw new UnprocessableEntityException('DOCTOR_SCHEDULE_SHIFT_REQUIRED');
      }

      const workDate = this.isoDate(schedule.work_date);
      const dateGroup = this.ensureDateGroup(dates, workDate);
      const doctorGroup: AvailabilityDoctorGroup = {
        doctor_id: schedule.doctor_id,
        clinic_id: schedule.clinic_id,
        room: {
          room_id: schedule.room_id,
          room_name: schedule.room.room_name,
        },
        slots: [],
      };
      const starts = generateCandidateStarts(
        schedule.shift.start_time,
        schedule.shift.end_time,
        service.duration_minutes,
      );
      for (const start of starts) {
        const interval = buildOccupiedInterval(
          workDate,
          start,
          service.duration_minutes,
        );
        if (
          this.hasConflict(
            interval,
            appointments,
            schedule.doctor_id,
            schedule.room_id,
            query.patient_id,
          )
        ) {
          continue;
        }
        doctorGroup.slots.push({
          option_token: this.optionTokens.sign({
            patient_id: query.patient_id,
            service_id: service.service_id,
            clinic_id: schedule.clinic_id,
            doctor_id: schedule.doctor_id,
            room_id: schedule.room_id,
            work_date: workDate,
            start_time: start,
          }),
          start_time: start,
          occupied_until: this.formatTime(interval.end),
        });
      }
      if (doctorGroup.slots.length) {
        dateGroup.doctors.push(doctorGroup);
      }
    }

    return {
      service: {
        id: service.service_id,
        name: service.service_name,
        duration_minutes: service.duration_minutes,
        required_room_type: service.required_room_type,
      },
      dates: [...dates.values()].filter((date) => date.doctors.length),
    };
  }

  private hasConflict(
    interval: OccupiedInterval,
    appointments: AppointmentEntity[],
    doctorId: string,
    roomId: string,
    patientId: string,
  ): boolean {
    return appointments.some((appointment) => {
      if (
        appointment.doctor_id !== doctorId &&
        appointment.room_id !== roomId &&
        appointment.patient_id !== patientId
      ) {
        return false;
      }
      const existing = buildOccupiedInterval(
        this.isoDate(appointment.appointment_date),
        appointment.appointment_time,
        appointment.duration_minutes,
      );
      return interval.start < existing.end && existing.start < interval.end;
    });
  }

  private ensureDateGroup(
    dates: Map<string, AvailabilityDateGroup>,
    workDate: string,
  ): AvailabilityDateGroup {
    let group = dates.get(workDate);
    if (!group) {
      group = { date: workDate, doctors: [] };
      dates.set(workDate, group);
    }
    return group;
  }

  private isoDate(value: Date | string): string {
    return value instanceof Date
      ? value.toISOString().split('T')[0]
      : String(value).split('T')[0];
  }

  private formatTime(value: Date): string {
    return `${value.getHours().toString().padStart(2, '0')}:${value
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }
}
