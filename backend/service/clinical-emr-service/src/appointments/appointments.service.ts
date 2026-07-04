import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
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
import { assertTransition } from './appointment-status.machine';
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
import { BookAppointmentOptionDto } from './dto/book-appointment-option.dto';
import { RescheduleAppointmentOptionDto } from './dto/reschedule-appointment-option.dto';
import {
  AppointmentNotificationPayload,
  AppointmentNotificationPublisher,
  AppointmentNotificationType,
} from './appointment-notification.publisher';
import { KycEligibilityClient } from './kyc-eligibility.client';
import { PatientsService } from '../patients/patients.service';
import { ServiceEntity } from '../services/entities/service.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';
import { TreatmentPlanEntity } from '../treatment-plans/entities/treatment-plan.entity';
import {
  AppointmentOptionClaims,
  AppointmentOptionTokenService,
} from './appointment-option-token.service';
import { AppointmentReminderPreferenceEntity } from './entities/appointment-reminder-preference.entity';
import { AppointmentNotificationLogEntity } from './entities/appointment-notification-log.entity';
import { UpdateReminderPreferenceDto } from './dto/update-reminder-preference.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

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
    private readonly patientsService: PatientsService,
    @InjectRepository(ServiceEntity, 'clinicConnection')
    private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(ExaminationSessionEntity)
    private readonly examinationSessionsRepository: Repository<ExaminationSessionEntity>,
    @InjectRepository(TreatmentPlanEntity)
    private readonly treatmentPlansRepository: Repository<TreatmentPlanEntity>,
    private readonly optionTokens: AppointmentOptionTokenService,
    @InjectRepository(AppointmentReminderPreferenceEntity, 'clinicConnection')
    private readonly reminderPreferencesRepository: Repository<AppointmentReminderPreferenceEntity>,
    @InjectRepository(AppointmentNotificationLogEntity, 'clinicConnection')
    private readonly notificationLogsRepository: Repository<AppointmentNotificationLogEntity>,
  ) {}

  private isExclusionViolation(error: unknown): boolean {
    const code =
      (error as { code?: string })?.code ??
      (error as { driverError?: { code?: string } })?.driverError?.code;
    return code === '23P01';
  }

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

  private async resolveActorPatientId(
    actorUserId: string | undefined,
  ): Promise<string | null> {
    if (!actorUserId) {
      return null;
    }
    const patient = await this.patientsService.findByUserId(actorUserId);
    return patient?.patient_id ?? null;
  }

  private async resolveBookingPatientId(
    requestedPatientId: string,
    actorUserId: string | undefined,
    actorRole?: string,
  ): Promise<{ patientId: string; kycUserId: string | undefined }> {
    const actorPatientId = await this.resolveActorPatientId(actorUserId);
    if (actorPatientId && actorPatientId !== requestedPatientId) {
      throw new ForbiddenException(
        'The authenticated user can only book appointments for their own patient record.',
      );
    }
    const patientId = actorPatientId ?? requestedPatientId;
    if (actorPatientId) {
      await this.patientsService.findOne(patientId);
      return { patientId, kycUserId: actorUserId };
    }
    if (
      this.isPrivilegedStaffRole(actorRole) ||
      this.normalizeActorRole(actorRole) === 'DOCTOR'
    ) {
      const patient = await this.patientsService.findOne(patientId);
      if (!patient.user_id) {
        throw new BadRequestException('PATIENT_USER_PROJECTION_REQUIRED');
      }
      return { patientId, kycUserId: patient.user_id };
    }
    throw new ForbiddenException(
      'A trusted patient, doctor, or staff role is required to create appointment records.',
    );
  }

  private async assertKnownDoctorId(doctorId: string): Promise<void> {
    const [schedule, specialty] = await Promise.all([
      this.doctorScheduleRepository.findOne({
        where: { doctor_id: doctorId },
      }),
      this.doctorSpecialtyRepository.findOne({
        where: { doctor_id: doctorId },
      }),
    ]);

    if (!schedule && !specialty) {
      throw new BadRequestException('DOCTOR_RECORD_NOT_FOUND');
    }
  }

  private async assertFollowUpLinkAllowed(
    dto: CreateAppointmentDto,
    patientId: string,
  ): Promise<void> {
    if (
      dto.appointment_type !== 'follow_up' ||
      (!dto.session_id && !dto.treatment_plan_id)
    ) {
      return;
    }

    const session = dto.session_id
      ? await this.examinationSessionsRepository.findOne({
          where: { session_id: dto.session_id },
        })
      : null;
    if (dto.session_id && !session) {
      throw new NotFoundException(
        `Examination session with ID ${dto.session_id} not found`,
      );
    }
    if (session) {
      this.assertFollowUpSessionContext(dto, patientId, session);
    }

    const treatmentPlan = dto.treatment_plan_id
      ? await this.treatmentPlansRepository.findOne({
          where: { plan_id: dto.treatment_plan_id },
        })
      : null;
    if (dto.treatment_plan_id && !treatmentPlan) {
      throw new NotFoundException(
        `Treatment plan with ID ${dto.treatment_plan_id} not found`,
      );
    }
    if (treatmentPlan) {
      this.assertFollowUpTreatmentPlanContext(dto, patientId, treatmentPlan);
      if (session && treatmentPlan.session_id !== session.session_id) {
        throw new BadRequestException(
          'Follow-up treatment plan does not belong to the linked examination session.',
        );
      }
      const treatmentPlanSession =
        treatmentPlan.session_id && !session
          ? await this.examinationSessionsRepository.findOne({
              where: { session_id: treatmentPlan.session_id },
            })
          : null;
      if (treatmentPlan.session_id && !session && !treatmentPlanSession) {
        throw new NotFoundException(
          `Examination session with ID ${treatmentPlan.session_id} not found`,
        );
      }
      if (treatmentPlanSession) {
        this.assertFollowUpSessionContext(dto, patientId, treatmentPlanSession);
      }
      if (this.isTreatmentPlanAcceptedForFollowUp(treatmentPlan)) {
        return;
      }
    }

    if (session && this.isSessionFinalizedForFollowUp(session)) {
      return;
    }

    throw new ConflictException(
      'Follow-up appointments must be linked to a finalized encounter or an accepted treatment plan.',
    );
  }

  private assertFollowUpSessionContext(
    dto: CreateAppointmentDto,
    patientId: string,
    session: ExaminationSessionEntity,
  ): void {
    const mismatches: string[] = [];
    if (session.patient_id && session.patient_id !== patientId) {
      mismatches.push('patient_id');
    }
    if (session.doctor_id && session.doctor_id !== dto.doctor_id) {
      mismatches.push('doctor_id');
    }
    if (session.clinic_id && session.clinic_id !== dto.clinic_id) {
      mismatches.push('clinic_id');
    }
    if (mismatches.length) {
      throw new BadRequestException(
        `Follow-up appointment context does not match examination session: ${mismatches.join(', ')}.`,
      );
    }
  }

  private assertFollowUpTreatmentPlanContext(
    dto: CreateAppointmentDto,
    patientId: string,
    treatmentPlan: TreatmentPlanEntity,
  ): void {
    const mismatches: string[] = [];
    if (treatmentPlan.patient_id && treatmentPlan.patient_id !== patientId) {
      mismatches.push('patient_id');
    }
    if (mismatches.length) {
      throw new BadRequestException(
        `Follow-up appointment context does not match treatment plan: ${mismatches.join(', ')}.`,
      );
    }
  }

  private isSessionFinalizedForFollowUp(
    session: ExaminationSessionEntity,
  ): boolean {
    return (
      ['completed', 'signed'].includes(session.status) || !!session.signed_at
    );
  }

  private isTreatmentPlanAcceptedForFollowUp(
    treatmentPlan: TreatmentPlanEntity,
  ): boolean {
    return [
      'accepted',
      'partially_accepted',
      'in_progress',
      'completed',
    ].includes(treatmentPlan.status);
  }

  private normalizeActorRole(actorRole?: string): string | undefined {
    return actorRole?.trim().toUpperCase();
  }

  private isPrivilegedStaffRole(actorRole?: string): boolean {
    return ['ADMIN', 'RECEPTIONIST', 'NURSE'].includes(
      this.normalizeActorRole(actorRole) ?? '',
    );
  }

  private async assertAppointmentOwnership(
    appointment: AppointmentEntity,
    actorUserId: string | undefined,
    actorRole?: string,
  ): Promise<void> {
    const normalizedRole = this.normalizeActorRole(actorRole);
    const actorPatientId = await this.resolveActorPatientId(actorUserId);
    if (actorPatientId && actorPatientId !== appointment.patient_id) {
      throw new ForbiddenException(
        'The authenticated user can only modify their own appointment records.',
      );
    }
    if (
      !actorPatientId &&
      normalizedRole === 'DOCTOR' &&
      actorUserId &&
      actorUserId !== appointment.doctor_id
    ) {
      throw new ForbiddenException(
        'The authenticated doctor can only modify their own appointment records.',
      );
    }
    if (
      !actorPatientId &&
      normalizedRole !== 'DOCTOR' &&
      !this.isPrivilegedStaffRole(actorRole)
    ) {
      throw new ForbiddenException(
        'A trusted patient, doctor, or staff role is required for appointment records.',
      );
    }
  }

  private async assertScheduledServiceRoom(
    option: AppointmentOptionClaims,
  ): Promise<ServiceEntity> {
    const service = await this.serviceRepository.findOne({
      where: { service_id: option.service_id, is_active: true },
    });
    if (!service) {
      throw new BadRequestException(
        `Service ${option.service_id} is not available.`,
      );
    }

    const schedule = await this.doctorScheduleRepository.findOne({
      where: {
        doctor_id: option.doctor_id,
        clinic_id: option.clinic_id,
        work_date: new Date(option.work_date) as any,
        status: 'scheduled',
      },
      relations: ['room', 'shift'],
    });

    if (!schedule) {
      throw new BadRequestException(
        `Doctor ${option.doctor_id} has no scheduled availability at clinic ${option.clinic_id} on ${option.work_date}. ` +
          `Use the standard create endpoint to book outside this constraint.`,
      );
    }
    if (
      !schedule.room_id ||
      schedule.room_id !== option.room_id ||
      !schedule.room
    ) {
      throw new BadRequestException('DOCTOR_SCHEDULE_ROOM_REQUIRED');
    }
    if (schedule.room.room_type !== service.required_room_type) {
      throw new BadRequestException('ROOM_TYPE_MISMATCH');
    }

    return service;
  }

  private optionClaimsFromDoctorDto(
    dto: BookByDoctorDto,
  ): AppointmentOptionClaims {
    if (!dto.service_id || !dto.room_id) {
      throw new BadRequestException(
        'service_id and room_id are required for doctor booking.',
      );
    }
    return {
      patient_id: dto.patient_id,
      service_id: dto.service_id,
      clinic_id: dto.clinic_id,
      doctor_id: dto.doctor_id,
      room_id: dto.room_id,
      work_date: dto.appointment_date,
      start_time: dto.appointment_time,
    };
  }

  private assertNoGenericSchedulingUpdate(dto: UpdateAppointmentDto): void {
    const schedulingFields: Array<keyof UpdateAppointmentDto> = [
      'room_id',
      'service_id',
      'appointment_date',
      'appointment_time',
      'duration_minutes',
    ];
    const attempted = schedulingFields.filter(
      (field) => dto[field] !== undefined,
    );
    if (attempted.length) {
      throw new BadRequestException('SCHEDULING_UPDATE_REQUIRES_OPTION_TOKEN');
    }
  }

  // UC-048/049/050: Create appointment (by clinic, specialty, or doctor)
  async create(
    dto: CreateAppointmentDto,
    actorUserId?: string,
    actorRole?: string,
    options?: { doctorValidated?: boolean },
  ): Promise<AppointmentEntity> {
    const { patientId, kycUserId } = await this.resolveBookingPatientId(
      dto.patient_id,
      actorUserId ?? dto.created_by,
      actorRole,
    );
    if (!options?.doctorValidated) {
      await this.assertKnownDoctorId(dto.doctor_id);
    }
    const createdBy = actorUserId ?? dto.created_by;
    await this.kycEligibilityClient.assertCanBook(kycUserId ?? createdBy);
    await this.assertFollowUpLinkAllowed(dto, patientId);

    const saved = await this.appointmentRepository.manager.transaction(
      async (entityManager): Promise<AppointmentEntity> => {
        const appointment = entityManager.create(AppointmentEntity, {
          ...dto,
          patient_id: patientId,
          created_by: createdBy,
          appointment_code: this.generateAppointmentCode(),
          appointment_date: new Date(dto.appointment_date),
        });

        let persisted: AppointmentEntity;
        try {
          persisted = await entityManager.save(appointment);
        } catch (error) {
          if (this.isExclusionViolation(error)) {
            throw new ConflictException(
              'This doctor already has an appointment that overlaps the requested time slot.',
            );
          }
          throw error;
        }

        await entityManager.save(
          entityManager.create(AppointmentStatusHistoryEntity, {
            appointment_id: persisted.appointment_id,
            old_status: null,
            new_status: AppointmentStatus.SCHEDULED,
            changed_by: createdBy,
            reason: 'Appointment created',
          }),
        );

        return persisted;
      },
    );

    // TODO: UC-054/055: Send confirmation notification via notification-service
    // TODO: UC-058: Trigger payment flow via payment-service if needed

    return saved;
  }

  // UC-048~050: List appointments with filters
  async findAll(
    query: QueryAppointmentDto,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<{ data: AppointmentEntity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<AppointmentEntity> = {};
    const actorPatientId = await this.resolveActorPatientId(actorUserId);

    if (actorPatientId) {
      if (query.patient_id && query.patient_id !== actorPatientId) {
        throw new ForbiddenException(
          'The authenticated user can only read their own appointment records.',
        );
      }
      where.patient_id = actorPatientId;
    } else if (query.patient_id) {
      where.patient_id = query.patient_id;
    }
    if (
      !actorPatientId &&
      this.normalizeActorRole(actorRole) === 'DOCTOR' &&
      actorUserId
    ) {
      if (query.doctor_id && query.doctor_id !== actorUserId) {
        throw new ForbiddenException(
          'The authenticated doctor can only read their own appointment records.',
        );
      }
      where.doctor_id = actorUserId;
    } else if (query.doctor_id) {
      where.doctor_id = query.doctor_id;
    }
    if (
      !actorPatientId &&
      this.normalizeActorRole(actorRole) !== 'DOCTOR' &&
      !this.isPrivilegedStaffRole(actorRole)
    ) {
      throw new ForbiddenException(
        'A trusted patient, doctor, or staff role is required for appointment records.',
      );
    }
    if (query.clinic_id) where.clinic_id = query.clinic_id;
    if (query.status) where.status = query.status;
    if (query.appointment_type) where.appointment_type = query.appointment_type;
    if (query.session_id) where.session_id = query.session_id;
    if (query.treatment_plan_id)
      where.treatment_plan_id = query.treatment_plan_id;
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

  async findById(
    id: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<NullableType<AppointmentEntity>> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointment_id: id },
      relations: ['clinic', 'room', 'service', 'status_history'],
    });
    if (appointment) {
      await this.assertAppointmentOwnership(
        appointment,
        actorUserId,
        actorRole,
      );
    }
    return appointment;
  }

  async findByCode(
    code: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<NullableType<AppointmentEntity>> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointment_code: code },
      relations: ['clinic', 'room', 'service', 'status_history'],
    });
    if (appointment) {
      await this.assertAppointmentOwnership(
        appointment,
        actorUserId,
        actorRole,
      );
    }
    return appointment;
  }

  // UC-048: Update appointment details
  async update(
    id: string,
    dto: UpdateAppointmentDto,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findById(
      id,
      actorUserId ?? dto.updated_by,
      actorRole,
    );
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    await this.assertAppointmentOwnership(
      appointment,
      actorUserId ?? dto.updated_by,
      actorRole,
    );
    this.assertNoGenericSchedulingUpdate(dto);

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
  async confirm(
    id: string,
    changedBy: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
    const confirmed = await this.changeStatus(
      id,
      {
        status: AppointmentStatus.CONFIRMED,
        changed_by: changedBy,
        reason: 'Appointment confirmed',
      },
      changedBy,
      actorRole,
    );
    await this.trySendAppointmentConfirmation(confirmed);

    return confirmed;
  }

  // UC-053: Cancel appointment
  async cancel(
    id: string,
    dto: CancelAppointmentDto,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findById(
      id,
      actorUserId ?? dto.cancelled_by,
      actorRole,
    );
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    await this.assertAppointmentOwnership(
      appointment,
      actorUserId ?? dto.cancelled_by,
      actorRole,
    );

    const oldStatus = appointment.status;
    assertTransition(oldStatus, AppointmentStatus.CANCELLED);

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
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findById(
      id,
      actorUserId ?? dto.changed_by,
      actorRole,
    );
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    await this.assertAppointmentOwnership(
      appointment,
      actorUserId ?? dto.changed_by,
      actorRole,
    );

    const oldStatus = appointment.status;
    assertTransition(oldStatus, dto.status);

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

  async checkIn(
    id: string,
    checkedInBy: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findById(id, checkedInBy, actorRole);
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    await this.assertAppointmentOwnership(appointment, checkedInBy, actorRole);
    return this.changeStatus(
      id,
      {
        status: AppointmentStatus.CHECKED_IN,
        changed_by: checkedInBy,
        reason: 'Patient checked in',
      },
      checkedInBy,
      actorRole,
    );
  }

  // Get status history for an appointment
  async getStatusHistory(
    appointmentId: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentStatusHistoryEntity[]> {
    await this.getExistingAppointment(appointmentId, actorUserId, actorRole);
    return this.historyRepository.find({
      where: { appointment_id: appointmentId },
      order: { created_at: 'DESC' },
    });
  }

  // UC-061: Chatbot - lookup appointment by patient
  async findByPatient(
    patientId: string,
    status?: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity[]> {
    const actorPatientId = await this.resolveActorPatientId(actorUserId);
    if (actorPatientId && actorPatientId !== patientId) {
      throw new ForbiddenException(
        'The authenticated user can only read their own appointment records.',
      );
    }
    if (!actorPatientId && !this.isPrivilegedStaffRole(actorRole)) {
      throw new ForbiddenException(
        'A trusted patient or staff role is required for patient appointment records.',
      );
    }
    const where: FindOptionsWhere<AppointmentEntity> = {
      patient_id: patientId,
    };
    if (status) where.status = status;

    return this.appointmentRepository.find({
      where,
      relations: ['clinic', 'room', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
    });
  }

  // UC-061: Chatbot - lookup appointment by doctor
  async findByDoctor(
    doctorId: string,
    date?: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity[]> {
    const where: FindOptionsWhere<AppointmentEntity> = {
      doctor_id: doctorId,
    };
    const actorPatientId = await this.resolveActorPatientId(actorUserId);
    if (actorPatientId) {
      where.patient_id = actorPatientId;
    } else if (
      this.normalizeActorRole(actorRole) === 'DOCTOR' &&
      actorUserId &&
      actorUserId !== doctorId
    ) {
      throw new ForbiddenException(
        'The authenticated doctor can only read their own appointment records.',
      );
    } else if (
      this.normalizeActorRole(actorRole) !== 'DOCTOR' &&
      !this.isPrivilegedStaffRole(actorRole)
    ) {
      throw new ForbiddenException(
        'A trusted patient, doctor, or staff role is required for doctor appointment records.',
      );
    }
    if (date) {
      where.appointment_date = new Date(date) as any;
    }

    return this.appointmentRepository.find({
      where,
      relations: ['clinic', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
    });
  }

  async findDoctorWorklist(
    doctorId: string,
    date?: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity[]> {
    const actorPatientId = await this.resolveActorPatientId(actorUserId);
    if (actorPatientId) {
      throw new ForbiddenException(
        'Patient actors cannot read doctor worklists.',
      );
    }
    if (
      this.normalizeActorRole(actorRole) === 'DOCTOR' &&
      actorUserId &&
      actorUserId !== doctorId
    ) {
      throw new ForbiddenException(
        'The authenticated doctor can only read their own worklist.',
      );
    }
    if (
      this.normalizeActorRole(actorRole) !== 'DOCTOR' &&
      !this.isPrivilegedStaffRole(actorRole)
    ) {
      throw new ForbiddenException(
        'A trusted doctor or staff role is required for doctor worklists.',
      );
    }

    const appointmentDate = new Date(
      date ?? new Date().toISOString().slice(0, 10),
    );

    return this.appointmentRepository.find({
      where: {
        doctor_id: doctorId,
        appointment_date: appointmentDate as any,
        status: AppointmentStatus.CHECKED_IN,
      },
      relations: ['clinic', 'room', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
    });
  }

  // UC-049: Create appointment by specialty — auto-selects an available doctor
  async createBySpecialty(
    dto: BookBySpecialtyDto,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
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

    return this.create(
      {
        patient_id: dto.patient_id,
        doctor_id: selectedDoctorId,
        clinic_id: dto.clinic_id,
        appointment_date: preferredDate,
        appointment_time: dto.preferred_time ?? '09:00',
        duration_minutes: dto.duration_minutes,
        chief_complaint: dto.chief_complaint,
        notes: dto.notes,
        created_by: dto.created_by,
      },
      actorUserId ?? dto.created_by,
      actorRole,
      { doctorValidated: true },
    );
  }

  // UC-050: Create appointment by specific doctor — validates doctor availability
  async createByDoctor(
    dto: BookByDoctorDto,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
    const option = this.optionClaimsFromDoctorDto(dto);
    const service = await this.assertScheduledServiceRoom(option);

    return this.create(
      {
        patient_id: dto.patient_id,
        doctor_id: dto.doctor_id,
        clinic_id: dto.clinic_id,
        room_id: dto.room_id,
        service_id: dto.service_id,
        appointment_date: dto.appointment_date,
        appointment_time: dto.appointment_time,
        duration_minutes: service.duration_minutes,
        appointment_type: dto.appointment_type,
        chief_complaint: dto.chief_complaint,
        notes: dto.notes,
        created_by: dto.created_by,
      },
      actorUserId ?? dto.created_by,
      actorRole,
      { doctorValidated: true },
    );
  }

  async createByOption(
    dto: BookAppointmentOptionDto,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
    const option = this.optionTokens.verify(dto.option_token);
    if (option.patient_id !== dto.patient_id) {
      throw new BadRequestException('APPOINTMENT_OPTION_PATIENT_MISMATCH');
    }
    const service = await this.assertScheduledServiceRoom(option);

    return this.create(
      {
        patient_id: option.patient_id,
        doctor_id: option.doctor_id,
        clinic_id: option.clinic_id,
        room_id: option.room_id,
        service_id: option.service_id,
        appointment_date: option.work_date,
        appointment_time: option.start_time,
        duration_minutes: service.duration_minutes,
        appointment_type: dto.appointment_type,
        chief_complaint: dto.chief_complaint,
        notes: dto.notes,
        created_by: dto.created_by,
      },
      actorUserId ?? dto.created_by,
      actorRole,
      { doctorValidated: true },
    );
  }

  async rescheduleByOption(
    id: string,
    dto: RescheduleAppointmentOptionDto,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findById(
      id,
      actorUserId ?? dto.updated_by,
      actorRole,
    );
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    await this.assertAppointmentOwnership(
      appointment,
      actorUserId ?? dto.updated_by,
      actorRole,
    );

    const option = this.optionTokens.verify(dto.option_token);
    if (option.patient_id !== appointment.patient_id) {
      throw new BadRequestException('APPOINTMENT_OPTION_PATIENT_MISMATCH');
    }
    const service = await this.assertScheduledServiceRoom(option);

    Object.assign(appointment, {
      doctor_id: option.doctor_id,
      clinic_id: option.clinic_id,
      room_id: option.room_id,
      service_id: option.service_id,
      appointment_date: new Date(option.work_date),
      appointment_time: option.start_time,
      duration_minutes: service.duration_minutes,
      notes: dto.notes ?? appointment.notes,
      updated_by: actorUserId ?? dto.updated_by,
    });
    return this.appointmentRepository.save(appointment);
  }

  // UC-051: Create appointment outside regular working hours
  async createOutsideHours(
    dto: BookOutsideHoursDto,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
    return this.create(
      {
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
      },
      actorUserId ?? dto.created_by,
      actorRole,
    );
  }

  async sendConfirmation(id: string, actorUserId?: string, actorRole?: string) {
    const appointment = await this.getExistingAppointment(
      id,
      actorUserId,
      actorRole,
    );
    const payload = await this.buildNotificationPayload(
      appointment,
      'APPOINTMENT_CONFIRMATION',
    );

    return this.notificationPublisher.sendAppointmentConfirmation(payload);
  }

  private async trySendAppointmentConfirmation(
    appointment: AppointmentEntity,
  ): Promise<void> {
    try {
      const payload = await this.buildNotificationPayload(
        appointment,
        'APPOINTMENT_CONFIRMATION',
      );
      await this.notificationPublisher.sendAppointmentConfirmation(payload);
    } catch (error) {
      this.logger.warn(
        `Appointment ${appointment.appointment_id} was confirmed, but confirmation notification could not be sent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async sendReminder(id: string, actorUserId?: string, actorRole?: string) {
    const appointment = await this.getExistingAppointment(
      id,
      actorUserId,
      actorRole,
    );
    const preference = await this.findReminderPreference(
      appointment.patient_id,
      'APP',
    );
    if (!preference.enabled) {
      return this.saveReminderLog({
        appointment_id: appointment.appointment_id,
        status: 'skipped',
        preference_enabled: false,
        reminder_minutes_before: preference.reminder_minutes_before,
      });
    }

    const payload = await this.buildNotificationPayload(
      appointment,
      'APPOINTMENT_REMINDER',
    );

    try {
      const result =
        await this.notificationPublisher.sendAppointmentReminder(payload);
      return this.saveReminderLog({
        appointment_id: appointment.appointment_id,
        status: 'sent',
        notification_id: result?.notificationId ?? null,
        preference_enabled: true,
        reminder_minutes_before: preference.reminder_minutes_before,
      });
    } catch (error) {
      await this.saveReminderLog({
        appointment_id: appointment.appointment_id,
        status: 'failed',
        preference_enabled: true,
        reminder_minutes_before: preference.reminder_minutes_before,
        error_message: error instanceof Error ? error.message : String(error),
        next_retry_at: new Date(Date.now() + 15 * 60 * 1000),
      });
      throw error;
    }
  }

  async retryReminder(id: string, actorUserId?: string, actorRole?: string) {
    const appointment = await this.getExistingAppointment(
      id,
      actorUserId,
      actorRole,
    );
    const log = await this.findLatestReminderLog(appointment.appointment_id);

    if (log.status !== 'failed') {
      throw new ConflictException('Only failed reminder logs can be retried');
    }
    if (log.next_retry_at && log.next_retry_at > new Date()) {
      throw new ConflictException('Reminder retry is not ready yet');
    }

    const preference = await this.findReminderPreference(
      appointment.patient_id,
      'APP',
    );
    log.preference_enabled = preference.enabled;
    log.reminder_minutes_before = preference.reminder_minutes_before;

    if (!preference.enabled) {
      log.status = 'skipped';
      log.error_message = null;
      log.next_retry_at = null;
      return this.notificationLogsRepository.save(log);
    }

    const payload = await this.buildNotificationPayload(
      appointment,
      'APPOINTMENT_REMINDER',
    );
    log.attempt_count = (log.attempt_count ?? 0) + 1;
    log.last_attempt_at = new Date();

    try {
      const result =
        await this.notificationPublisher.sendAppointmentReminder(payload);
      log.status = 'sent';
      log.notification_id = result?.notificationId ?? null;
      log.error_message = null;
      log.next_retry_at = null;
      return this.notificationLogsRepository.save(log);
    } catch (error) {
      log.status = 'failed';
      log.error_message = error instanceof Error ? error.message : String(error);
      log.next_retry_at = new Date(Date.now() + 15 * 60 * 1000);
      await this.notificationLogsRepository.save(log);
      throw error;
    }
  }

  async setReminderPreferenceForAppointment(
    id: string,
    dto: UpdateReminderPreferenceDto,
    actorUserId?: string,
    actorRole?: string,
  ) {
    const appointment = await this.getExistingAppointment(
      id,
      actorUserId,
      actorRole,
    );
    const channel = dto.channel?.trim() || 'APP';
    const existing = await this.reminderPreferencesRepository.findOne({
      where: { patient_id: appointment.patient_id, channel },
    });
    const preference =
      existing ??
      this.reminderPreferencesRepository.create({
        patient_id: appointment.patient_id,
        channel,
      });

    preference.enabled = dto.enabled;
    preference.reminder_minutes_before = dto.reminder_minutes_before ?? 1440;
    return this.reminderPreferencesRepository.save(preference);
  }

  async getReminderPreferenceForAppointment(
    id: string,
    actorUserId?: string,
    actorRole?: string,
  ) {
    const appointment = await this.getExistingAppointment(
      id,
      actorUserId,
      actorRole,
    );
    return this.findReminderPreference(appointment.patient_id, 'APP');
  }

  async markReminderRead(
    id: string,
    actorUserId?: string,
    actorRole?: string,
  ) {
    await this.getExistingAppointment(id, actorUserId, actorRole);
    const log = await this.findLatestReminderLog(id);
    log.status = 'read';
    log.read_at = log.read_at ?? new Date();
    return this.notificationLogsRepository.save(log);
  }

  async markReminderResponded(
    id: string,
    actorUserId?: string,
    actorRole?: string,
  ) {
    await this.getExistingAppointment(id, actorUserId, actorRole);
    const log = await this.findLatestReminderLog(id);
    log.status = 'responded';
    log.read_at = log.read_at ?? new Date();
    log.responded_at = log.responded_at ?? new Date();
    return this.notificationLogsRepository.save(log);
  }

  async findNotificationLogs(
    id: string,
    actorUserId?: string,
    actorRole?: string,
  ) {
    await this.getExistingAppointment(id, actorUserId, actorRole);
    return this.notificationLogsRepository.find({
      where: { appointment_id: id },
      order: { created_at: 'DESC' },
    });
  }

  private async findReminderPreference(patient_id: string, channel: string) {
    const preference = await this.reminderPreferencesRepository.findOne({
      where: { patient_id, channel },
    });

    return (
      preference ?? {
        patient_id,
        channel,
        enabled: true,
        reminder_minutes_before: 1440,
      }
    );
  }

  private async saveReminderLog(
    fields: Partial<AppointmentNotificationLogEntity> & {
      appointment_id: string;
      status: string;
    },
  ) {
    const log = this.notificationLogsRepository.create({
      notification_type: 'APPOINTMENT_REMINDER',
      channel: 'APP',
      attempt_count: fields.status === 'skipped' ? 0 : 1,
      last_attempt_at: fields.status === 'skipped' ? null : new Date(),
      notification_id: null,
      error_message: null,
      next_retry_at: null,
      read_at: null,
      responded_at: null,
      ...fields,
    });

    return this.notificationLogsRepository.save(log);
  }

  private async findLatestReminderLog(appointment_id: string) {
    const log = await this.notificationLogsRepository.findOne({
      where: {
        appointment_id,
        notification_type: 'APPOINTMENT_REMINDER',
      },
      order: { created_at: 'DESC' },
    });

    if (!log) {
      throw new NotFoundException('Appointment reminder log not found');
    }

    return log;
  }

  private async getExistingAppointment(
    id: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.findById(id, actorUserId, actorRole);
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  private async buildNotificationPayload(
    appointment: AppointmentEntity,
    notificationType: AppointmentNotificationType,
  ): Promise<AppointmentNotificationPayload> {
    const patient = await this.patientsService.findOne(appointment.patient_id);
    if (!patient.user_id) {
      throw new BadRequestException('PATIENT_USER_PROJECTION_REQUIRED');
    }
    const appointmentDate =
      appointment.appointment_date instanceof Date
        ? appointment.appointment_date.toISOString().split('T')[0]
        : appointment.appointment_date;
    const isConfirmation = notificationType === 'APPOINTMENT_CONFIRMATION';

    return {
      appointmentId: appointment.appointment_id,
      appointmentCode: appointment.appointment_code,
      recipientId: patient.user_id,
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
