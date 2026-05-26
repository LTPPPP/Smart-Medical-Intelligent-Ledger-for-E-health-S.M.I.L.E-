import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  LessThanOrEqual,
  Repository,
} from 'typeorm';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { AppointmentStatusHistoryEntity } from '../appointments/entities/appointment-status-history.entity';
import { PatientEntity } from '../patients/entities/patient.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';
import { EmailOutboxEntity } from './entities/email-outbox.entity';
import { HandoffTicketEntity } from './entities/handoff-ticket.entity';
import { SlotHoldEntity } from './entities/slot-hold.entity';
import { SlotEntity } from './entities/slot.entity';
import { WaitlistEntryEntity } from './entities/waitlist-entry.entity';
import {
  EmailOutboxStatus,
  HandoffTicketStatus,
  NotificationType,
  SlotHoldStatus,
  SlotStatus,
  WaitlistEntryStatus,
} from './enums/agent-scheduling.enum';

type StructuredErrorCode =
  | 'SLOT_NOT_FOUND'
  | 'SLOT_ALREADY_HELD_OR_BOOKED'
  | 'HOLD_NOT_FOUND'
  | 'HOLD_EXPIRED'
  | 'HOLD_SESSION_MISMATCH'
  | 'APPOINTMENT_NOT_FOUND'
  | 'APPOINTMENT_ALREADY_CANCELLED'
  | 'INVALID_PATIENT_PHONE'
  | 'SERVICE_NOT_FOUND'
  | 'DENTIST_NOT_FOUND'
  | 'OUTSIDE_OPENING_HOURS'
  | 'VALIDATION_ERROR'
  | 'MEDICAL_RISK_REQUIRES_HANDOFF'
  | 'DUPLICATE_CONFIRMATION';

export interface AgentSchedulingError {
  success: false;
  error_code: StructuredErrorCode;
  message: string;
  recommended_action?: string;
  details?: Record<string, unknown>;
}

export interface AgentSchedulingSuccess<T> {
  success: true;
  data: T;
}

export type AgentSchedulingResult<T> =
  | AgentSchedulingSuccess<T>
  | AgentSchedulingError;

export interface HoldSlotRequest {
  slot_id: string;
  patient_session_id: string;
  ttl_seconds: number;
}

export interface ReleaseHoldRequest {
  hold_id: string;
}

export interface ConfirmBookingRequest {
  hold_id: string;
  patient_session_id: string;
  service_id: string;
  patient: {
    patient_id?: string;
    full_name: string;
    phone: string;
    email?: string;
  };
}

export interface CancelAppointmentRequest {
  appointment_id: string;
  patient_id?: string;
  cancelled_by: string;
  cancellation_reason?: string;
}

export interface RescheduleAppointmentRequest {
  appointment_id: string;
  new_hold_id: string;
  patient_session_id: string;
  changed_by: string;
}

export interface AddToWaitlistRequest {
  patient_id?: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  clinic_id: string;
  service_id: string;
  dentist_id?: string;
  preferred_date: string;
  preferred_start_time?: string;
  preferred_end_time?: string;
}

export interface SendEmailNotificationRequest {
  notification_type: NotificationType;
  recipient_type: string;
  recipient_email: string;
  template_data: Record<string, unknown>;
}

const HIGH_RISK_KEYWORDS = [
  'facial swelling',
  'fever',
  'difficulty breathing',
  'uncontrolled bleeding',
  'severe pain',
  'trauma',
  'broken tooth after accident',
  'infection',
  'pus',
  'spreading swelling',
  'chest pain',
  'fainting',
];

const EMAIL_TEMPLATES: Record<
  NotificationType,
  { subject: string; body: string }
> = {
  [NotificationType.BOOKING_CONFIRMATION]: {
    subject: 'Your dental appointment is confirmed',
    body: 'Your appointment has been confirmed. Please arrive on time.',
  },
  [NotificationType.BOOKING_REMINDER]: {
    subject: 'Dental appointment reminder',
    body: 'This is a reminder for your upcoming dental appointment.',
  },
  [NotificationType.CANCELLATION_CONFIRMATION]: {
    subject: 'Your dental appointment was cancelled',
    body: 'Your appointment cancellation has been recorded.',
  },
  [NotificationType.RESCHEDULE_CONFIRMATION]: {
    subject: 'Your dental appointment was rescheduled',
    body: 'Your appointment has been rescheduled successfully.',
  },
  [NotificationType.WAITLIST_SLOT_AVAILABLE]: {
    subject: 'A dental appointment slot is available',
    body: 'A matching slot is available. Please book it before it is taken.',
  },
  [NotificationType.HANDOFF_ALERT]: {
    subject: 'Manual review required for dental chatbot conversation',
    body: 'A patient conversation requires clinic staff review.',
  },
  [NotificationType.MANUAL_REVIEW_REQUIRED]: {
    subject: 'Manual review required',
    body: 'A clinic workflow requires manual review.',
  },
};

@Injectable()
export class AgentSchedulingService {
  constructor(
    @InjectDataSource('clinicConnection')
    private readonly dataSource: DataSource,
    @InjectRepository(SlotEntity, 'clinicConnection')
    private readonly slotRepository: Repository<SlotEntity>,
    @InjectRepository(SlotHoldEntity, 'clinicConnection')
    private readonly holdRepository: Repository<SlotHoldEntity>,
    @InjectRepository(AppointmentEntity, 'clinicConnection')
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(AppointmentStatusHistoryEntity, 'clinicConnection')
    private readonly historyRepository: Repository<AppointmentStatusHistoryEntity>,
    @InjectRepository(ServiceEntity, 'clinicConnection')
    private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(PatientEntity, 'clinicConnection')
    private readonly patientRepository: Repository<PatientEntity>,
    @InjectRepository(WaitlistEntryEntity, 'clinicConnection')
    private readonly waitlistRepository: Repository<WaitlistEntryEntity>,
    @InjectRepository(EmailOutboxEntity, 'clinicConnection')
    private readonly emailOutboxRepository: Repository<EmailOutboxEntity>,
    @InjectRepository(HandoffTicketEntity, 'clinicConnection')
    private readonly handoffTicketRepository: Repository<HandoffTicketEntity>,
  ) {}

  async getAvailableSlots(query: {
    clinic_id?: string;
    dentist_id?: string;
    service_id?: string;
    date?: string;
  }): Promise<AgentSchedulingResult<SlotEntity[]>> {
    await this.expireElapsedHolds();
    const where: Record<string, unknown> = { status: SlotStatus.AVAILABLE };
    if (query.clinic_id) where.clinic_id = query.clinic_id;
    if (query.dentist_id) where.doctor_id = query.dentist_id;
    if (query.service_id) where.service_id = query.service_id;
    if (query.date) where.slot_date = new Date(query.date);

    const slots = await this.slotRepository.find({
      where,
      order: { slot_date: 'ASC', start_time: 'ASC' },
    });
    return this.ok(slots);
  }

  async holdSlot(
    request: HoldSlotRequest,
  ): Promise<AgentSchedulingResult<SlotHoldEntity>> {
    const ttlError = this.validateHoldTtl(request.ttl_seconds);
    if (ttlError) return ttlError;

    return this.dataSource.transaction(async (manager) => {
      const slots = manager.getRepository(SlotEntity);
      const holds = manager.getRepository(SlotHoldEntity);
      const slot = await slots.findOne({
        where: { slot_id: request.slot_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) {
        return this.error('SLOT_NOT_FOUND', 'Slot was not found.');
      }

      if (slot.status !== SlotStatus.AVAILABLE) {
        return this.slotTakenError();
      }

      const expiresAt = new Date(Date.now() + request.ttl_seconds * 1000);
      const hold = holds.create({
        slot_id: slot.slot_id,
        patient_session_id: request.patient_session_id,
        status: SlotHoldStatus.ACTIVE,
        expires_at: expiresAt,
      });

      slot.status = SlotStatus.HELD;
      slot.held_by_session_id = request.patient_session_id;
      slot.hold_expires_at = expiresAt;
      await slots.save(slot);

      return this.ok(await holds.save(hold));
    });
  }

  async confirmBooking(
    request: ConfirmBookingRequest,
  ): Promise<AgentSchedulingResult<AppointmentEntity>> {
    const patientError = this.validatePatient(request.patient);
    if (patientError) return patientError;

    return this.dataSource.transaction(async (manager) => {
      const holds = manager.getRepository(SlotHoldEntity);
      const slots = manager.getRepository(SlotEntity);
      const appointments = manager.getRepository(AppointmentEntity);
      const histories = manager.getRepository(AppointmentStatusHistoryEntity);
      const services = manager.getRepository(ServiceEntity);
      const patients = manager.getRepository(PatientEntity);

      const hold = await holds.findOne({
        where: { hold_id: request.hold_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!hold) return this.error('HOLD_NOT_FOUND', 'Hold was not found.');
      if (hold.patient_session_id !== request.patient_session_id) {
        return this.error(
          'HOLD_SESSION_MISMATCH',
          'Hold belongs to another session.',
        );
      }
      if (hold.status === SlotHoldStatus.CONFIRMED) {
        return this.error(
          'DUPLICATE_CONFIRMATION',
          'This hold was already confirmed.',
        );
      }
      if (
        hold.status !== SlotHoldStatus.ACTIVE ||
        hold.expires_at <= new Date()
      ) {
        hold.status = SlotHoldStatus.EXPIRED;
        await holds.save(hold);
        return this.error('HOLD_EXPIRED', 'Hold is no longer active.');
      }

      const slot = await slots.findOne({
        where: { slot_id: hold.slot_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!slot || slot.status !== SlotStatus.HELD)
        return this.slotTakenError();
      if (!slot.doctor_id) {
        return this.error('DENTIST_NOT_FOUND', 'Slot does not have a dentist.');
      }

      const service = await services.findOne({
        where: { service_id: request.service_id },
      });
      if (!service)
        return this.error('SERVICE_NOT_FOUND', 'Service was not found.');

      const patient = request.patient.patient_id
        ? await patients.findOne({
            where: { patient_id: request.patient.patient_id },
          })
        : patients.create({
            patient_code: `CHAT-${Date.now()}`,
            full_name: request.patient.full_name,
            phone: request.patient.phone,
            email: request.patient.email ?? null,
          });

      if (!patient) {
        return this.error(
          'VALIDATION_ERROR',
          'Patient information is invalid.',
        );
      }

      const savedPatient = await patients.save(patient);
      const appointment = appointments.create({
        appointment_code: this.generateAppointmentCode(),
        patient_id: savedPatient.patient_id,
        doctor_id: slot.doctor_id,
        clinic_id: slot.clinic_id,
        room_id: slot.room_id,
        service_id: request.service_id,
        appointment_date: slot.slot_date,
        appointment_time: slot.start_time,
        duration_minutes: service.duration_minutes ?? slot.duration_minutes,
        appointment_type: 'chatbot_booking',
        status: AppointmentStatus.CONFIRMED,
        created_by: savedPatient.patient_id,
      } as Partial<AppointmentEntity>) as AppointmentEntity;
      const savedAppointment = (await appointments.save(
        appointment,
      )) as AppointmentEntity;

      slot.status = SlotStatus.BOOKED;
      slot.appointment_id = savedAppointment.appointment_id;
      slot.held_by_session_id = null;
      slot.hold_expires_at = null;
      hold.status = SlotHoldStatus.CONFIRMED;
      hold.confirmed_at = new Date();

      await slots.save(slot);
      await holds.save(hold);
      await histories.save(
        histories.create({
          appointment_id: savedAppointment.appointment_id,
          old_status: null,
          new_status: AppointmentStatus.CONFIRMED,
          changed_by: savedPatient.patient_id,
          reason: 'Confirmed through chatbot slot hold',
        }),
      );
      await this.queueEmailWithRepository(
        manager.getRepository(EmailOutboxEntity),
        {
          notification_type: NotificationType.BOOKING_CONFIRMATION,
          recipient_type: 'patient',
          recipient_email: request.patient.email ?? 'unknown@example.local',
          template_data: {
            appointment_id: savedAppointment.appointment_id,
            patient_id: savedPatient.patient_id,
            service_id: request.service_id,
            slot_id: slot.slot_id,
          },
        },
      );

      return this.ok(savedAppointment);
    });
  }

  async releaseHold(
    request: ReleaseHoldRequest,
  ): Promise<AgentSchedulingResult<SlotHoldEntity | null>> {
    return this.dataSource.transaction(async (manager) => {
      const holds = manager.getRepository(SlotHoldEntity);
      const slots = manager.getRepository(SlotEntity);
      const hold = await holds.findOne({
        where: { hold_id: request.hold_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!hold) return this.ok(null);

      if (hold.status === SlotHoldStatus.ACTIVE) {
        hold.status = SlotHoldStatus.RELEASED;
        hold.released_at = new Date();
        const slot = await slots.findOne({
          where: { slot_id: hold.slot_id },
          lock: { mode: 'pessimistic_write' },
        });
        if (slot && slot.status === SlotStatus.HELD) {
          slot.status = SlotStatus.AVAILABLE;
          slot.held_by_session_id = null;
          slot.hold_expires_at = null;
          await slots.save(slot);
        }
        await holds.save(hold);
      }

      return this.ok(hold);
    });
  }

  async cancelAppointment(
    request: CancelAppointmentRequest,
  ): Promise<AgentSchedulingResult<AppointmentEntity>> {
    return this.dataSource.transaction(async (manager) => {
      const appointments = manager.getRepository(AppointmentEntity);
      const histories = manager.getRepository(AppointmentStatusHistoryEntity);
      const slots = manager.getRepository(SlotEntity);
      const appointment = await appointments.findOne({
        where: { appointment_id: request.appointment_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!appointment) {
        return this.error(
          'APPOINTMENT_NOT_FOUND',
          'Appointment was not found.',
        );
      }
      if (appointment.status === AppointmentStatus.CANCELLED) {
        return this.error(
          'APPOINTMENT_ALREADY_CANCELLED',
          'Appointment was already cancelled.',
        );
      }

      const oldStatus = appointment.status;
      appointment.status = AppointmentStatus.CANCELLED;
      appointment.cancelled_by = request.cancelled_by;
      appointment.cancelled_at = new Date();
      appointment.cancellation_reason = request.cancellation_reason ?? null;
      const saved = await appointments.save(appointment);

      const slot = await slots.findOne({
        where: { appointment_id: appointment.appointment_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (slot) {
        slot.status = SlotStatus.AVAILABLE;
        slot.appointment_id = null;
        slot.held_by_session_id = null;
        slot.hold_expires_at = null;
        await slots.save(slot);
      }

      await histories.save(
        histories.create({
          appointment_id: appointment.appointment_id,
          old_status: oldStatus,
          new_status: AppointmentStatus.CANCELLED,
          changed_by: request.cancelled_by,
          reason: request.cancellation_reason ?? 'Cancelled through chatbot',
        }),
      );
      await this.queueEmailWithRepository(
        manager.getRepository(EmailOutboxEntity),
        {
          notification_type: NotificationType.CANCELLATION_CONFIRMATION,
          recipient_type: 'patient',
          recipient_email: 'unknown@example.local',
          template_data: { appointment_id: appointment.appointment_id },
        },
      );
      if (slot) await this.notifyWaitlistForSlot(slot, manager);

      return this.ok(saved);
    });
  }

  async rescheduleAppointment(
    request: RescheduleAppointmentRequest,
  ): Promise<AgentSchedulingResult<AppointmentEntity>> {
    return this.dataSource.transaction(async (manager) => {
      const appointments = manager.getRepository(AppointmentEntity);
      const holds = manager.getRepository(SlotHoldEntity);
      const slots = manager.getRepository(SlotEntity);
      const histories = manager.getRepository(AppointmentStatusHistoryEntity);

      const appointment = await appointments.findOne({
        where: { appointment_id: request.appointment_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!appointment) {
        return this.error(
          'APPOINTMENT_NOT_FOUND',
          'Appointment was not found.',
        );
      }
      if (
        appointment.status === AppointmentStatus.CANCELLED ||
        appointment.status === AppointmentStatus.COMPLETED
      ) {
        return this.error(
          'VALIDATION_ERROR',
          'Appointment cannot be rescheduled in its current status.',
        );
      }

      const hold = await holds.findOne({
        where: { hold_id: request.new_hold_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!hold) return this.error('HOLD_NOT_FOUND', 'Hold was not found.');
      if (hold.patient_session_id !== request.patient_session_id) {
        return this.error(
          'HOLD_SESSION_MISMATCH',
          'Hold belongs to another session.',
        );
      }
      if (
        hold.status !== SlotHoldStatus.ACTIVE ||
        hold.expires_at <= new Date()
      ) {
        return this.error('HOLD_EXPIRED', 'Hold is no longer active.');
      }

      const newSlot = await slots.findOne({
        where: { slot_id: hold.slot_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!newSlot || newSlot.status !== SlotStatus.HELD)
        return this.slotTakenError();

      const oldSlot = await slots.findOne({
        where: { appointment_id: appointment.appointment_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (oldSlot) {
        oldSlot.status = SlotStatus.AVAILABLE;
        oldSlot.appointment_id = null;
        await slots.save(oldSlot);
      }

      const oldStatus = appointment.status;
      appointment.status = AppointmentStatus.CONFIRMED;
      appointment.doctor_id = newSlot.doctor_id ?? appointment.doctor_id;
      appointment.clinic_id = newSlot.clinic_id;
      appointment.room_id = newSlot.room_id;
      appointment.appointment_date = newSlot.slot_date;
      appointment.appointment_time = newSlot.start_time;
      appointment.duration_minutes = newSlot.duration_minutes;
      const saved = await appointments.save(appointment);

      newSlot.status = SlotStatus.BOOKED;
      newSlot.appointment_id = appointment.appointment_id;
      newSlot.held_by_session_id = null;
      newSlot.hold_expires_at = null;
      hold.status = SlotHoldStatus.CONFIRMED;
      hold.confirmed_at = new Date();
      await slots.save(newSlot);
      await holds.save(hold);
      await histories.save(
        histories.create({
          appointment_id: appointment.appointment_id,
          old_status: oldStatus,
          new_status: AppointmentStatus.CONFIRMED,
          changed_by: request.changed_by,
          reason: 'Rescheduled through chatbot',
        }),
      );
      await this.queueEmailWithRepository(
        manager.getRepository(EmailOutboxEntity),
        {
          notification_type: NotificationType.RESCHEDULE_CONFIRMATION,
          recipient_type: 'patient',
          recipient_email: 'unknown@example.local',
          template_data: { appointment_id: appointment.appointment_id },
        },
      );

      return this.ok(saved);
    });
  }

  async addToWaitlist(
    request: AddToWaitlistRequest,
  ): Promise<AgentSchedulingResult<WaitlistEntryEntity>> {
    const phoneError = this.validatePhone(request.patient_phone);
    if (phoneError) return phoneError;
    if (new Date(request.preferred_date) < this.startOfToday()) {
      return this.error(
        'VALIDATION_ERROR',
        'Preferred date cannot be in the past.',
      );
    }

    const entry = this.waitlistRepository.create({
      patient_id: request.patient_id ?? null,
      patient_name: request.patient_name,
      patient_phone: request.patient_phone,
      patient_email: request.patient_email ?? null,
      clinic_id: request.clinic_id,
      service_id: request.service_id,
      doctor_id: request.dentist_id ?? null,
      preferred_date: new Date(request.preferred_date),
      preferred_start_time: request.preferred_start_time ?? null,
      preferred_end_time: request.preferred_end_time ?? null,
      status: WaitlistEntryStatus.ACTIVE,
    });

    return this.ok(await this.waitlistRepository.save(entry));
  }

  async checkWaitlistMatches(
    slotIdToMatch: string,
  ): Promise<AgentSchedulingResult<WaitlistEntryEntity[]>> {
    const slot = await this.slotRepository.findOne({
      where: { slot_id: slotIdToMatch },
    });
    if (!slot) return this.error('SLOT_NOT_FOUND', 'Slot was not found.');

    const entries = await this.waitlistRepository.find({
      where: {
        clinic_id: slot.clinic_id,
        service_id: slot.service_id ?? undefined,
        preferred_date: slot.slot_date,
        status: WaitlistEntryStatus.ACTIVE,
      },
      order: { created_at: 'ASC' },
    });

    return this.ok(
      entries.filter((entry) => {
        const dentistMatches =
          !entry.doctor_id || entry.doctor_id === slot.doctor_id;
        const startMatches =
          !entry.preferred_start_time ||
          entry.preferred_start_time <= slot.start_time;
        const endMatches =
          !entry.preferred_end_time ||
          entry.preferred_end_time >= slot.end_time;
        return dentistMatches && startMatches && endMatches;
      }),
    );
  }

  async sendEmailNotification(
    request: SendEmailNotificationRequest,
  ): Promise<AgentSchedulingResult<EmailOutboxEntity>> {
    return this.ok(
      await this.queueEmailWithRepository(this.emailOutboxRepository, request),
    );
  }

  classifyMedicalRisk(message: string): AgentSchedulingResult<{
    risk_level: 'LOW' | 'HIGH';
    matched_keywords: string[];
  }> {
    const lower = message.toLowerCase();
    const matched = HIGH_RISK_KEYWORDS.filter((keyword) =>
      lower.includes(keyword),
    );
    return this.ok({
      risk_level: matched.length ? 'HIGH' : 'LOW',
      matched_keywords: matched,
    });
  }

  async createHandoffTicket(request: {
    session_id: string;
    patient_id?: string;
    source_message: string;
    summary: string;
  }): Promise<AgentSchedulingResult<HandoffTicketEntity>> {
    const ticket = this.handoffTicketRepository.create({
      session_id: request.session_id,
      patient_id: request.patient_id ?? null,
      risk_level: 'HIGH',
      source_message: request.source_message,
      summary: request.summary,
      status: HandoffTicketStatus.OPEN,
    });
    return this.ok(await this.handoffTicketRepository.save(ticket));
  }

  summarizeForDentist(message: string): AgentSchedulingResult<{
    summary: string;
    safety_note: string;
  }> {
    const risk = this.classifyMedicalRisk(message);
    const matched =
      risk.success && risk.data.matched_keywords.length
        ? risk.data.matched_keywords.join(', ')
        : 'none';
    return this.ok({
      summary: `Patient reported: ${message}. High-risk keyword matches: ${matched}.`,
      safety_note:
        'This summary is not a diagnosis and requires dentist or clinic staff review.',
    });
  }

  private async expireElapsedHolds(): Promise<void> {
    const expiredHolds = await this.holdRepository.find({
      where: {
        status: SlotHoldStatus.ACTIVE,
        expires_at: LessThanOrEqual(new Date()),
      },
    });
    for (const hold of expiredHolds) {
      hold.status = SlotHoldStatus.EXPIRED;
      await this.holdRepository.save(hold);
      const slot = await this.slotRepository.findOne({
        where: { slot_id: hold.slot_id },
      });
      if (slot && slot.status === SlotStatus.HELD) {
        slot.status = SlotStatus.AVAILABLE;
        slot.held_by_session_id = null;
        slot.hold_expires_at = null;
        await this.slotRepository.save(slot);
      }
    }
  }

  private async notifyWaitlistForSlot(
    slot: SlotEntity,
    manager: EntityManager,
  ): Promise<void> {
    const waitlists = manager.getRepository(WaitlistEntryEntity);
    const emails = manager.getRepository(EmailOutboxEntity);
    const entries = await waitlists.find({
      where: {
        clinic_id: slot.clinic_id,
        service_id: slot.service_id ?? undefined,
        preferred_date: slot.slot_date,
        status: WaitlistEntryStatus.ACTIVE,
      },
      order: { created_at: 'ASC' },
    });

    for (const entry of entries) {
      if (!entry.patient_email) continue;
      entry.status = WaitlistEntryStatus.NOTIFIED;
      await waitlists.save(entry);
      await this.queueEmailWithRepository(emails, {
        notification_type: NotificationType.WAITLIST_SLOT_AVAILABLE,
        recipient_type: 'patient',
        recipient_email: entry.patient_email,
        template_data: {
          waitlist_entry_id: entry.waitlist_entry_id,
          slot_id: slot.slot_id,
        },
      });
    }
  }

  private async queueEmailWithRepository(
    repository: Repository<EmailOutboxEntity>,
    request: SendEmailNotificationRequest,
  ): Promise<EmailOutboxEntity> {
    const template = EMAIL_TEMPLATES[request.notification_type];
    const email = repository.create({
      notification_type: request.notification_type,
      recipient_type: request.recipient_type,
      recipient_email: request.recipient_email,
      subject: template.subject,
      body: template.body,
      template_data: request.template_data,
      status: EmailOutboxStatus.QUEUED,
    });
    return repository.save(email);
  }

  private validateHoldTtl(ttlSeconds: number): AgentSchedulingError | null {
    if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 600) {
      return this.error(
        'VALIDATION_ERROR',
        'Hold TTL must be between 60 and 600 seconds.',
        'RETRY_WITH_VALID_TTL',
        { ttl_seconds: ttlSeconds },
      );
    }
    return null;
  }

  private validatePatient(
    patient: ConfirmBookingRequest['patient'],
  ): AgentSchedulingError | null {
    if (!patient.full_name || !patient.phone) {
      return this.error(
        'VALIDATION_ERROR',
        'Patient full name and phone are required.',
      );
    }
    return this.validatePhone(patient.phone);
  }

  private validatePhone(phone: string): AgentSchedulingError | null {
    if (!/^\+?[0-9\s().-]{8,20}$/.test(phone)) {
      return this.error('INVALID_PATIENT_PHONE', 'Patient phone is invalid.');
    }
    return null;
  }

  private startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private generateAppointmentCode(): string {
    const now = new Date();
    const date =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `APT-${date}-${random}`;
  }

  private slotTakenError(): AgentSchedulingError {
    return this.error(
      'SLOT_ALREADY_HELD_OR_BOOKED',
      'This slot is no longer available.',
      'GET_AVAILABLE_SLOTS_AGAIN',
    );
  }

  private ok<T>(data: T): AgentSchedulingSuccess<T> {
    return { success: true, data };
  }

  private error(
    errorCode: StructuredErrorCode,
    message: string,
    recommendedAction?: string,
    details?: Record<string, unknown>,
  ): AgentSchedulingError {
    return {
      success: false,
      error_code: errorCode,
      message,
      ...(recommendedAction ? { recommended_action: recommendedAction } : {}),
      ...(details ? { details } : {}),
    };
  }
}
