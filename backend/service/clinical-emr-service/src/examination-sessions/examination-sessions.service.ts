import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExaminationSessionEntity } from './entities/examination-session.entity';
import { CreateExaminationSessionDto } from './dto/create-examination-session.dto';
import { UpdateExaminationSessionDto } from './dto/update-examination-session.dto';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { AppointmentStatusHistoryEntity } from '../appointments/entities/appointment-status-history.entity';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';
import { DiagnosisEntity } from '../diagnoses/entities/diagnosis.entity';
import { MedicalRecordsService } from '../medical-records/medical-records.service';
import { CreateExaminationAmendmentDto } from './dto/create-examination-amendment.dto';
import { ExaminationSessionAmendmentEntity } from './entities/examination-session-amendment.entity';
import { Actor } from '../auth/actor.util';
import {
  assertDoctorOwnership,
  resolveDoctorScope,
} from '../auth/ownership.util';

@Injectable()
export class ExaminationSessionsService {
  private readonly activeStatuses = ['in_progress'];
  private readonly lockedStatuses = ['completed', 'signed'];

  constructor(
    @InjectRepository(ExaminationSessionEntity)
    private examinationSessionsRepository: Repository<ExaminationSessionEntity>,
    @InjectRepository(AppointmentEntity, 'clinicConnection')
    private appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(AppointmentStatusHistoryEntity, 'clinicConnection')
    private appointmentStatusHistoryRepository: Repository<AppointmentStatusHistoryEntity>,
    @InjectRepository(DiagnosisEntity)
    private diagnosesRepository: Repository<DiagnosisEntity>,
    @InjectRepository(ExaminationSessionAmendmentEntity)
    private amendmentsRepository: Repository<ExaminationSessionAmendmentEntity>,
    private readonly medicalRecordsService: MedicalRecordsService,
  ) {}

  async create(
    createExaminationSessionDto: CreateExaminationSessionDto,
  ): Promise<ExaminationSessionEntity> {
    if (!createExaminationSessionDto.appointment_id) {
      throw new BadRequestException(
        'An appointment_id is required to start an examination session.',
      );
    }
    if (
      createExaminationSessionDto.status &&
      createExaminationSessionDto.status !== 'in_progress'
    ) {
      throw new BadRequestException(
        'New examination sessions must start in progress.',
      );
    }
    if (createExaminationSessionDto.completed_at) {
      throw new BadRequestException(
        'completed_at is assigned only by the finalize flow.',
      );
    }

    const appointment = await this.appointmentRepository.findOne({
      where: { appointment_id: createExaminationSessionDto.appointment_id },
    });
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${createExaminationSessionDto.appointment_id} not found`,
      );
    }

    if (appointment.status !== AppointmentStatus.CHECKED_IN) {
      throw new ConflictException(
        `Appointment must be '${AppointmentStatus.CHECKED_IN}' before starting an examination session.`,
      );
    }

    this.assertAppointmentContext(createExaminationSessionDto, appointment);

    const activeSession = await this.examinationSessionsRepository.findOne({
      where: {
        appointment_id: appointment.appointment_id,
        status: In(this.activeStatuses),
      },
    });
    if (activeSession) {
      throw new ConflictException(
        `An active examination session already exists for appointment ${appointment.appointment_id}.`,
      );
    }

    const recordId =
      createExaminationSessionDto.record_id ??
      (await this.createMedicalRecordForAppointment(
        createExaminationSessionDto,
        appointment,
      ));

    const examinationSession = this.examinationSessionsRepository.create({
      ...createExaminationSessionDto,
      appointment_id: appointment.appointment_id,
      record_id: recordId,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      clinic_id: appointment.clinic_id,
      status: createExaminationSessionDto.status ?? 'in_progress',
    });
    const savedSession =
      await this.examinationSessionsRepository.save(examinationSession);

    const oldStatus = appointment.status;
    appointment.status = AppointmentStatus.IN_PROGRESS;
    await this.appointmentRepository.save(appointment);
    await this.appointmentStatusHistoryRepository.save(
      this.appointmentStatusHistoryRepository.create({
        appointment_id: appointment.appointment_id,
        old_status: oldStatus,
        new_status: AppointmentStatus.IN_PROGRESS,
        changed_by: appointment.doctor_id,
        reason: 'Examination session started',
      }),
    );

    return savedSession;
  }

  private async createMedicalRecordForAppointment(
    dto: CreateExaminationSessionDto,
    appointment: AppointmentEntity,
  ): Promise<string> {
    const record = await this.medicalRecordsService.create({
      appointment_id: appointment.appointment_id,
      patient_id: appointment.patient_id,
      clinic_id: appointment.clinic_id,
      doctor_id: appointment.doctor_id,
      visit_date: this.formatVisitDate(appointment.appointment_date),
      chief_complaint:
        dto.chief_complaint ?? appointment.chief_complaint ?? undefined,
      notes: appointment.notes ?? undefined,
      record_status: 'draft',
    });
    return record.record_id;
  }

  private formatVisitDate(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).slice(0, 10);
  }

  private assertAppointmentContext(
    dto: CreateExaminationSessionDto,
    appointment: AppointmentEntity,
  ): void {
    const mismatches: string[] = [];

    if (dto.patient_id && dto.patient_id !== appointment.patient_id) {
      mismatches.push('patient_id');
    }
    if (dto.doctor_id && dto.doctor_id !== appointment.doctor_id) {
      mismatches.push('doctor_id');
    }
    if (dto.clinic_id && dto.clinic_id !== appointment.clinic_id) {
      mismatches.push('clinic_id');
    }

    if (mismatches.length) {
      throw new BadRequestException(
        `Examination session context does not match appointment: ${mismatches.join(', ')}.`,
      );
    }
  }

  async findAll(actor?: Actor): Promise<ExaminationSessionEntity[]> {
    // A DOCTOR sees only their own sessions; ADMIN sees all (F1-002).
    const doctorScope = resolveDoctorScope(actor);
    return this.examinationSessionsRepository.find(
      doctorScope ? { where: { doctor_id: doctorScope } } : undefined,
    );
  }

  async findOne(
    session_id: string,
    actor?: Actor,
  ): Promise<ExaminationSessionEntity> {
    const examinationSession = await this.examinationSessionsRepository.findOne(
      {
        where: { session_id },
      },
    );
    if (!examinationSession) {
      throw new NotFoundException(
        `Examination session with ID ${session_id} not found`,
      );
    }
    assertDoctorOwnership(actor, examinationSession.doctor_id);
    return examinationSession;
  }

  async findByPatientId(
    patient_id: string,
    actor?: Actor,
  ): Promise<ExaminationSessionEntity[]> {
    // A DOCTOR only sees their own encounters with the patient; ADMIN sees all.
    const doctorScope = resolveDoctorScope(actor);
    return this.examinationSessionsRepository.find({
      where: doctorScope
        ? { patient_id, doctor_id: doctorScope }
        : { patient_id },
    });
  }

  async findByDoctorId(
    doctor_id: string,
    actor?: Actor,
  ): Promise<ExaminationSessionEntity[]> {
    // A DOCTOR may only query their own id; ADMIN may query any doctor.
    const doctorScope = resolveDoctorScope(actor, doctor_id);
    return this.examinationSessionsRepository.find({
      where: { doctor_id: doctorScope ?? doctor_id },
    });
  }

  async findByAppointmentId(
    appointment_id: string,
    actor?: Actor,
  ): Promise<ExaminationSessionEntity> {
    const examinationSession = await this.examinationSessionsRepository.findOne(
      {
        where: { appointment_id },
      },
    );
    if (!examinationSession) {
      throw new NotFoundException(
        `Examination session for appointment ID ${appointment_id} not found`,
      );
    }
    assertDoctorOwnership(actor, examinationSession.doctor_id);
    return examinationSession;
  }

  async update(
    session_id: string,
    updateExaminationSessionDto: UpdateExaminationSessionDto,
    actor?: Actor,
  ): Promise<ExaminationSessionEntity> {
    const examinationSession = await this.findOne(session_id, actor);
    this.assertSessionMutable(examinationSession);
    this.assertSessionContextUnchanged(
      examinationSession,
      updateExaminationSessionDto,
    );
    this.assertStatusUpdateAllowed(updateExaminationSessionDto);
    this.assertFinalizeFieldsUnchanged(updateExaminationSessionDto);
    Object.assign(examinationSession, updateExaminationSessionDto);
    return this.examinationSessionsRepository.save(examinationSession);
  }

  async finalize(
    session_id: string,
    actor?: Actor,
  ): Promise<ExaminationSessionEntity> {
    const examinationSession = await this.findOne(session_id, actor);
    if (this.lockedStatuses.includes(examinationSession.status)) {
      throw new ConflictException('Examination session is already finalized.');
    }
    if (examinationSession.status !== 'in_progress') {
      throw new ConflictException(
        'Only in-progress examination sessions can be finalized.',
      );
    }

    this.assertReadyToFinalize(examinationSession);

    const diagnosisCount = await this.diagnosesRepository.count({
      where: { session_id },
    });
    if (diagnosisCount < 1) {
      throw new BadRequestException(
        'At least one diagnosis is required before finalizing an examination session.',
      );
    }

    const finalizedAt = new Date();
    examinationSession.status = 'completed';
    examinationSession.completed_at = finalizedAt;
    examinationSession.signed_at = finalizedAt;
    examinationSession.signed_by = examinationSession.doctor_id;

    const savedSession =
      await this.examinationSessionsRepository.save(examinationSession);
    await this.finalizeLinkedMedicalRecord(savedSession);
    await this.completeLinkedAppointment(savedSession);

    return savedSession;
  }

  async createAmendment(
    session_id: string,
    dto: CreateExaminationAmendmentDto,
    actor?: Actor,
  ): Promise<ExaminationSessionAmendmentEntity> {
    const examinationSession = await this.findOne(session_id, actor);
    this.assertSessionFinalizedForAmendment(examinationSession);
    this.assertAmendmentAuthor(examinationSession, dto);

    const amendment = this.amendmentsRepository.create({
      session_id: examinationSession.session_id,
      record_id: examinationSession.record_id,
      patient_id: examinationSession.patient_id,
      doctor_id: examinationSession.doctor_id,
      amendment_reason: dto.amendment_reason.trim(),
      amendment_text: dto.amendment_text.trim(),
      amended_by: dto.amended_by,
    });

    const savedAmendment = await this.amendmentsRepository.save(amendment);
    if (savedAmendment.record_id) {
      await this.medicalRecordsService.createVersion(
        savedAmendment.record_id,
        this.buildAmendmentVersionSnapshot(savedAmendment),
        savedAmendment.amended_by,
        'Examination session amendment',
      );
    }

    return savedAmendment;
  }

  private buildAmendmentVersionSnapshot(
    amendment: ExaminationSessionAmendmentEntity,
  ): Record<string, unknown> {
    return {
      type: 'examination_session_amendment',
      amendment_id: amendment.amendment_id,
      session_id: amendment.session_id,
      record_id: amendment.record_id,
      patient_id: amendment.patient_id,
      doctor_id: amendment.doctor_id,
      amendment_reason: amendment.amendment_reason,
      amendment_text: amendment.amendment_text,
      amended_by: amendment.amended_by,
      created_at: amendment.created_at,
    };
  }

  private assertAmendmentAuthor(
    examinationSession: ExaminationSessionEntity,
    dto: CreateExaminationAmendmentDto,
  ): void {
    if (dto.amended_by !== examinationSession.doctor_id) {
      throw new BadRequestException('AMENDMENT_DOCTOR_MISMATCH');
    }
  }

  async findAmendments(
    session_id: string,
    actor?: Actor,
  ): Promise<ExaminationSessionAmendmentEntity[]> {
    await this.findOne(session_id, actor);
    return this.amendmentsRepository.find({
      where: { session_id },
      order: { created_at: 'DESC' },
    });
  }

  private async finalizeLinkedMedicalRecord(
    examinationSession: ExaminationSessionEntity,
  ): Promise<void> {
    if (!examinationSession.record_id) {
      return;
    }
    await this.medicalRecordsService.finalize(
      examinationSession.record_id,
      examinationSession.doctor_id,
    );
  }

  private assertReadyToFinalize(
    examinationSession: ExaminationSessionEntity,
  ): void {
    const hasClinicalNote = [
      examinationSession.chief_complaint,
      examinationSession.present_illness,
      examinationSession.physical_examination,
    ].some((value) => typeof value === 'string' && value.trim().length > 0);

    if (!hasClinicalNote) {
      throw new BadRequestException(
        'A minimum clinical note is required before finalizing an examination session.',
      );
    }
  }

  private assertSessionFinalizedForAmendment(
    examinationSession: ExaminationSessionEntity,
  ): void {
    if (
      !this.lockedStatuses.includes(examinationSession.status) ||
      !examinationSession.signed_at
    ) {
      throw new ConflictException(
        'Use the normal update flow before an examination session is finalized.',
      );
    }
  }

  private assertSessionContextUnchanged(
    examinationSession: ExaminationSessionEntity,
    updateExaminationSessionDto: UpdateExaminationSessionDto,
  ): void {
    const contextFields = [
      'appointment_id',
      'record_id',
      'patient_id',
      'doctor_id',
      'clinic_id',
    ] as const;

    for (const field of contextFields) {
      const nextValue = updateExaminationSessionDto[field];
      if (nextValue !== undefined && nextValue !== examinationSession[field]) {
        throw new BadRequestException(`${field} cannot be changed`);
      }
    }
  }

  private assertStatusUpdateAllowed(
    updateExaminationSessionDto: UpdateExaminationSessionDto,
  ): void {
    if (
      updateExaminationSessionDto.status !== undefined &&
      updateExaminationSessionDto.status !== 'in_progress'
    ) {
      throw new ConflictException(
        'Use the finalize flow to complete or sign an examination session.',
      );
    }
  }

  private assertFinalizeFieldsUnchanged(
    updateExaminationSessionDto: UpdateExaminationSessionDto,
  ): void {
    if (updateExaminationSessionDto.completed_at !== undefined) {
      throw new ConflictException(
        'Use the finalize flow to set completion timestamps.',
      );
    }
  }

  private async completeLinkedAppointment(
    examinationSession: ExaminationSessionEntity,
  ): Promise<void> {
    if (!examinationSession.appointment_id) {
      return;
    }

    const appointment = await this.appointmentRepository.findOne({
      where: { appointment_id: examinationSession.appointment_id },
    });
    if (!appointment || appointment.status === AppointmentStatus.COMPLETED) {
      return;
    }

    const oldStatus = appointment.status;
    appointment.status = AppointmentStatus.COMPLETED;
    await this.appointmentRepository.save(appointment);
    await this.appointmentStatusHistoryRepository.save(
      this.appointmentStatusHistoryRepository.create({
        appointment_id: appointment.appointment_id,
        old_status: oldStatus,
        new_status: AppointmentStatus.COMPLETED,
        changed_by: examinationSession.doctor_id,
        reason: 'Examination session finalized',
      }),
    );
  }

  async remove(session_id: string, actor?: Actor): Promise<void> {
    const examinationSession = await this.findOne(session_id, actor);
    this.assertSessionMutable(examinationSession);
    await this.examinationSessionsRepository.remove(examinationSession);
  }

  private assertSessionMutable(
    examinationSession: ExaminationSessionEntity,
  ): void {
    if (
      this.lockedStatuses.includes(examinationSession.status) ||
      examinationSession.signed_at
    ) {
      throw new ConflictException(
        'Finalized examination sessions cannot be changed. Create an amendment instead.',
      );
    }
  }
}
