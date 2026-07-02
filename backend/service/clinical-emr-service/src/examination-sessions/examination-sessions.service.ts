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

    const examinationSession = this.examinationSessionsRepository.create(
      {
        ...createExaminationSessionDto,
        appointment_id: appointment.appointment_id,
        record_id: recordId,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        clinic_id: appointment.clinic_id,
        status: createExaminationSessionDto.status ?? 'in_progress',
      },
    );
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

  async findAll(): Promise<ExaminationSessionEntity[]> {
    return this.examinationSessionsRepository.find();
  }

  async findOne(session_id: string): Promise<ExaminationSessionEntity> {
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
    return examinationSession;
  }

  async findByPatientId(
    patient_id: string,
  ): Promise<ExaminationSessionEntity[]> {
    return this.examinationSessionsRepository.find({
      where: { patient_id },
    });
  }

  async findByDoctorId(doctor_id: string): Promise<ExaminationSessionEntity[]> {
    return this.examinationSessionsRepository.find({
      where: { doctor_id },
    });
  }

  async findByAppointmentId(
    appointment_id: string,
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
    return examinationSession;
  }

  async update(
    session_id: string,
    updateExaminationSessionDto: UpdateExaminationSessionDto,
  ): Promise<ExaminationSessionEntity> {
    const examinationSession = await this.findOne(session_id);
    if (this.lockedStatuses.includes(examinationSession.status)) {
      throw new ConflictException(
        'Finalized examination sessions cannot be updated. Create an amendment instead.',
      );
    }
    this.assertSessionContextUnchanged(
      examinationSession,
      updateExaminationSessionDto,
    );
    this.assertStatusUpdateAllowed(updateExaminationSessionDto);
    Object.assign(examinationSession, updateExaminationSessionDto);
    return this.examinationSessionsRepository.save(examinationSession);
  }

  async finalize(session_id: string): Promise<ExaminationSessionEntity> {
    const examinationSession = await this.findOne(session_id);
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

  async remove(session_id: string): Promise<void> {
    const examinationSession = await this.findOne(session_id);
    await this.examinationSessionsRepository.remove(examinationSession);
  }
}
