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
import { AppointmentEntity } from './entities/appointment.entity';
import { AppointmentStatusHistoryEntity } from './entities/appointment-status-history.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ChangeAppointmentStatusDto } from './dto/change-appointment-status.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { NullableType } from '../utils/types/nullable.type';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';
import { DoctorSpecialtyEntity } from '../doctor-specialties/entities/doctor-specialty.entity';
import { DoctorScheduleEntity } from '../doctor-schedules/entities/doctor-schedule.entity';
import { BookBySpecialtyDto } from './dto/book-by-specialty.dto';
import { BookByDoctorDto } from './dto/book-by-doctor.dto';
import { BookOutsideHoursDto } from './dto/book-outside-hours.dto';
import {
  AppointmentNotificationPayload,
  AppointmentNotificationPublisher,
  AppointmentNotificationType,
} from './appointment-notification.publisher';
import { KycEligibilityClient } from './kyc-eligibility.client';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentEntity, 'clinicConnection')
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(AppointmentStatusHistoryEntity, 'clinicConnection')
    private readonly historyRepository: Repository<AppointmentStatusHistoryEntity>,
    @InjectRepository(DoctorSpecialtyEntity, 'clinicConnection')
    private readonly doctorSpecialtyRepository: Repository<DoctorSpecialtyEntity>,
    @InjectRepository(DoctorScheduleEntity, 'clinicConnection')
    private readonly doctorScheduleRepository: Repository<DoctorScheduleEntity>,
    private readonly notificationPublisher: AppointmentNotificationPublisher,
    private readonly kycEligibilityClient: KycEligibilityClient,
  ) {}

  // Generate unique appointment code (APT-YYYYMMDD-XXXX)
  private generateAppointmentCode(): string {
    const now = new Date();
    const dateStr =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `APT-${dateStr}-${rand}`;
  }

  // UC-048/049/050: Create appointment (by clinic, specialty, or doctor)
  async create(dto: CreateAppointmentDto): Promise<AppointmentEntity> {
    await this.kycEligibilityClient.assertCanBook(dto.created_by);

    const appointment = this.appointmentRepository.create({
      ...dto,
      appointment_code: this.generateAppointmentCode(),
      appointment_date: new Date(dto.appointment_date),
    });

    const saved = await this.appointmentRepository.save(appointment);

    // Create initial status history entry
    await this.historyRepository.save(
      this.historyRepository.create({
        appointment_id: saved.appointment_id,
        old_status: null,
        new_status: AppointmentStatus.SCHEDULED,
        changed_by: dto.created_by,
        reason: 'Appointment created',
      }),
    );

    // TODO: UC-054/055: Send confirmation notification via notification-service
    // TODO: UC-058: Trigger payment flow via payment-service if needed

    return saved;
  }

  // UC-048~050: List appointments with filters
  async findAll(
    query: QueryAppointmentDto,
  ): Promise<{ data: AppointmentEntity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<AppointmentEntity> = {};

    if (query.patient_id) where.patient_id = query.patient_id;
    if (query.doctor_id) where.doctor_id = query.doctor_id;
    if (query.clinic_id) where.clinic_id = query.clinic_id;
    if (query.status) where.status = query.status;
    if (query.appointment_type) where.appointment_type = query.appointment_type;
    if (query.payment_status) where.payment_status = query.payment_status;
    if (query.is_outside_hours !== undefined)
      where.is_outside_hours = query.is_outside_hours;

    if (query.appointment_date) {
      where.appointment_date = new Date(query.appointment_date) as any;
    } else if (query.date_from && query.date_to) {
      where.appointment_date = Between(
        new Date(query.date_from),
        new Date(query.date_to),
      ) as any;
    } else if (query.date_from) {
      where.appointment_date = MoreThanOrEqual(
        new Date(query.date_from),
      ) as any;
    } else if (query.date_to) {
      where.appointment_date = LessThanOrEqual(new Date(query.date_to)) as any;
    }

    const [data, total] = await this.appointmentRepository.findAndCount({
      where,
      relations: ['clinic', 'room', 'service'],
      skip,
      take: limit,
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<NullableType<AppointmentEntity>> {
    return this.appointmentRepository.findOne({
      where: { appointment_id: id },
      relations: ['clinic', 'room', 'service', 'status_history'],
    });
  }

  async findByCode(code: string): Promise<NullableType<AppointmentEntity>> {
    return this.appointmentRepository.findOne({
      where: { appointment_code: code },
      relations: ['clinic', 'room', 'service', 'status_history'],
    });
  }

  // UC-048: Update appointment details
  async update(
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findById(id);
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    const updateData = {
      ...dto,
      appointment_date: dto.appointment_date
        ? new Date(dto.appointment_date)
        : appointment.appointment_date,
    };

    Object.assign(appointment, updateData);
    return this.appointmentRepository.save(appointment);
  }

  // UC-052: Confirm appointment
  async confirm(id: string, changedBy: string): Promise<AppointmentEntity> {
    return this.changeStatus(id, {
      status: AppointmentStatus.CONFIRMED,
      changed_by: changedBy,
      reason: 'Appointment confirmed',
    });
  }

  // UC-053: Cancel appointment
  async cancel(
    id: string,
    dto: CancelAppointmentDto,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findById(id);
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    const oldStatus = appointment.status;
    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelled_by = dto.cancelled_by;
    appointment.cancellation_reason = dto.cancellation_reason ?? null;
    appointment.cancelled_at = new Date();

    const saved = await this.appointmentRepository.save(appointment);

    // Record status change
    await this.historyRepository.save(
      this.historyRepository.create({
        appointment_id: id,
        old_status: oldStatus,
        new_status: AppointmentStatus.CANCELLED,
        changed_by: dto.cancelled_by,
        reason: dto.cancellation_reason ?? 'Appointment cancelled',
      }),
    );

    // TODO: UC-055: Send cancellation notification via notification-service
    // TODO: UC-059/060: Handle payment refund via payment-service if applicable

    return saved;
  }

  // UC-052/053: General status change with audit trail
  async changeStatus(
    id: string,
    dto: ChangeAppointmentStatusDto,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findById(id);
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    const oldStatus = appointment.status;
    appointment.status = dto.status;
    const saved = await this.appointmentRepository.save(appointment);

    // Record status change
    await this.historyRepository.save(
      this.historyRepository.create({
        appointment_id: id,
        old_status: oldStatus,
        new_status: dto.status,
        changed_by: dto.changed_by,
        reason: dto.reason ?? null,
      }),
    );

    // TODO: UC-054/055: Send status change notification

    return saved;
  }

  // Get status history for an appointment
  async getStatusHistory(
    appointmentId: string,
  ): Promise<AppointmentStatusHistoryEntity[]> {
    return this.historyRepository.find({
      where: { appointment_id: appointmentId },
      order: { created_at: 'DESC' },
    });
  }

  // UC-061: Chatbot - lookup appointment by patient
  async findByPatient(
    patientId: string,
    status?: string,
  ): Promise<AppointmentEntity[]> {
    const where: FindOptionsWhere<AppointmentEntity> = {
      patient_id: patientId,
    };
    if (status) where.status = status;

    return this.appointmentRepository.find({
      where,
      relations: ['clinic', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
    });
  }

  // UC-061: Chatbot - lookup appointment by doctor
  async findByDoctor(
    doctorId: string,
    date?: string,
  ): Promise<AppointmentEntity[]> {
    const where: FindOptionsWhere<AppointmentEntity> = {
      doctor_id: doctorId,
    };
    if (date) {
      where.appointment_date = new Date(date) as any;
    }

    return this.appointmentRepository.find({
      where,
      relations: ['clinic', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
    });
  }

  // UC-049: Create appointment by specialty — auto-selects an available doctor
  async createBySpecialty(dto: BookBySpecialtyDto): Promise<AppointmentEntity> {
    // Find doctors with the requested specialty
    const doctorSpecialties = await this.doctorSpecialtyRepository.find({
      where: { specialty_id: dto.specialty_id },
    });

    if (!doctorSpecialties.length) {
      throw new BadRequestException(
        `No doctors found for specialty ${dto.specialty_id}`,
      );
    }

    const doctorIds = doctorSpecialties.map((ds) => ds.doctor_id);
    const preferredDate =
      dto.preferred_date ?? new Date().toISOString().split('T')[0];

    // Try to find a doctor with an available schedule on the preferred date
    let selectedDoctorId: string | null = null;
    for (const doctorId of doctorIds) {
      const schedule = await this.doctorScheduleRepository.findOne({
        where: {
          doctor_id: doctorId,
          clinic_id: dto.clinic_id,
          work_date: new Date(preferredDate) as any,
          status: 'scheduled',
        },
      });
      if (schedule) {
        selectedDoctorId = doctorId;
        break;
      }
    }

    if (!selectedDoctorId) {
      throw new BadRequestException(
        `No scheduled doctors found for specialty ${dto.specialty_id} at clinic ${dto.clinic_id} on ${preferredDate}`,
      );
    }

    return this.create({
      patient_id: dto.patient_id,
      doctor_id: selectedDoctorId,
      clinic_id: dto.clinic_id,
      appointment_date: preferredDate,
      appointment_time: dto.preferred_time ?? '09:00',
      duration_minutes: dto.duration_minutes,
      chief_complaint: dto.chief_complaint,
      notes: dto.notes,
      created_by: dto.created_by,
    });
  }

  // UC-050: Create appointment by specific doctor — validates doctor availability
  async createByDoctor(dto: BookByDoctorDto): Promise<AppointmentEntity> {
    // Verify doctor has a schedule on the requested date at this clinic
    const schedule = await this.doctorScheduleRepository.findOne({
      where: {
        doctor_id: dto.doctor_id,
        clinic_id: dto.clinic_id,
        work_date: new Date(dto.appointment_date) as any,
        status: 'scheduled',
      },
    });

    if (!schedule) {
      throw new BadRequestException(
        `Doctor ${dto.doctor_id} has no scheduled availability at clinic ${dto.clinic_id} on ${dto.appointment_date}. ` +
          `Use the standard create endpoint to book outside this constraint.`,
      );
    }

    return this.create({
      patient_id: dto.patient_id,
      doctor_id: dto.doctor_id,
      clinic_id: dto.clinic_id,
      room_id: dto.room_id,
      service_id: dto.service_id,
      appointment_date: dto.appointment_date,
      appointment_time: dto.appointment_time,
      duration_minutes: dto.duration_minutes,
      appointment_type: dto.appointment_type,
      chief_complaint: dto.chief_complaint,
      notes: dto.notes,
      created_by: dto.created_by,
    });
  }

  // UC-051: Create appointment outside regular working hours
  async createOutsideHours(
    dto: BookOutsideHoursDto,
  ): Promise<AppointmentEntity> {
    return this.create({
      patient_id: dto.patient_id,
      doctor_id: dto.doctor_id,
      clinic_id: dto.clinic_id,
      room_id: dto.room_id,
      service_id: dto.service_id,
      appointment_date: dto.appointment_date,
      appointment_time: dto.appointment_time,
      duration_minutes: dto.duration_minutes,
      appointment_type: dto.appointment_type,
      chief_complaint: dto.chief_complaint,
      notes: dto.notes,
      is_outside_hours: true,
      outside_hours_reason: dto.outside_hours_reason,
      approved_by: dto.approved_by,
      created_by: dto.created_by,
    });
  }

  async sendConfirmation(id: string) {
    const appointment = await this.getExistingAppointment(id);
    const payload = this.buildNotificationPayload(
      appointment,
      'APPOINTMENT_CONFIRMATION',
    );

    return this.notificationPublisher.sendAppointmentConfirmation(payload);
  }

  async sendReminder(id: string) {
    const appointment = await this.getExistingAppointment(id);
    const payload = this.buildNotificationPayload(
      appointment,
      'APPOINTMENT_REMINDER',
    );

    return this.notificationPublisher.sendAppointmentReminder(payload);
  }

  private async getExistingAppointment(id: string): Promise<AppointmentEntity> {
    const appointment = await this.findById(id);
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  private buildNotificationPayload(
    appointment: AppointmentEntity,
    notificationType: AppointmentNotificationType,
  ): AppointmentNotificationPayload {
    const appointmentDate =
      appointment.appointment_date instanceof Date
        ? appointment.appointment_date.toISOString().split('T')[0]
        : appointment.appointment_date;
    const isConfirmation = notificationType === 'APPOINTMENT_CONFIRMATION';

    return {
      appointmentId: appointment.appointment_id,
      appointmentCode: appointment.appointment_code,
      recipientId: appointment.patient_id,
      notificationType,
      relatedEntityType: 'appointment',
      relatedEntityId: appointment.appointment_id,
      appointmentDate,
      appointmentTime: appointment.appointment_time,
      title: isConfirmation
        ? 'Appointment confirmation'
        : 'Appointment reminder',
      message: isConfirmation
        ? `Your appointment ${appointment.appointment_code} is confirmed for ${appointmentDate} at ${appointment.appointment_time}.`
        : `Reminder: appointment ${appointment.appointment_code} is scheduled for ${appointmentDate} at ${appointment.appointment_time}.`,
    };
  }
}
