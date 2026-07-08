import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrescriptionEntity } from './entities/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';
import { PrescriptionItemEntity } from '../prescription-items/entities/prescription-item.entity';
import { PatientRepresentativesService } from '../patient-representatives/patient-representatives.service';
import { Actor } from '../auth/actor.util';
import {
  assertDoctorOwnership,
  resolveDoctorScope,
} from '../auth/ownership.util';

@Injectable()
export class PrescriptionsService {
  private readonly lockedStatuses = ['issued', 'cancelled'];
  private readonly lockedSessionStatuses = ['completed', 'signed'];

  constructor(
    @InjectRepository(PrescriptionEntity)
    private prescriptionsRepository: Repository<PrescriptionEntity>,
    @InjectRepository(ExaminationSessionEntity)
    private examinationSessionsRepository: Repository<ExaminationSessionEntity>,
    @InjectRepository(PrescriptionItemEntity)
    private prescriptionItemsRepository: Repository<PrescriptionItemEntity>,
    private patientRepresentativesService: PatientRepresentativesService,
  ) {}

  async create(
    createPrescriptionDto: CreatePrescriptionDto,
  ): Promise<PrescriptionEntity> {
    if (!createPrescriptionDto.session_id) {
      throw new BadRequestException(
        'A session_id is required to create a prescription.',
      );
    }
    if (
      createPrescriptionDto.status &&
      createPrescriptionDto.status !== 'draft'
    ) {
      throw new BadRequestException('New prescriptions must start as draft.');
    }

    const session = await this.findMutableSession(
      createPrescriptionDto.session_id,
    );
    this.assertSessionContext(createPrescriptionDto, session);

    const prescription = this.prescriptionsRepository.create({
      ...createPrescriptionDto,
      session_id: session.session_id,
      record_id: session.record_id,
      patient_id: session.patient_id ?? createPrescriptionDto.patient_id,
      doctor_id: session.doctor_id,
      status: createPrescriptionDto.status ?? 'draft',
    });
    return this.prescriptionsRepository.save(prescription);
  }

  async findAll(actor?: Actor): Promise<PrescriptionEntity[]> {
    const doctorScope = resolveDoctorScope(actor);
    return this.prescriptionsRepository.find(
      doctorScope ? { where: { doctor_id: doctorScope } } : undefined,
    );
  }

  async findOne(
    prescription_id: string,
    actor?: Actor,
  ): Promise<PrescriptionEntity> {
    const prescription = await this.prescriptionsRepository.findOne({
      where: { prescription_id },
      relations: ['session', 'patient'],
    });
    if (!prescription) {
      throw new NotFoundException(
        `Prescription with ID ${prescription_id} not found`,
      );
    }
    assertDoctorOwnership(actor, prescription.doctor_id);
    return prescription;
  }

  async findByPatientId(
    patient_id: string,
    actor?: Actor,
  ): Promise<PrescriptionEntity[]> {
    const doctorScope = resolveDoctorScope(actor);
    return this.prescriptionsRepository.find({
      where: doctorScope
        ? { patient_id, doctor_id: doctorScope }
        : { patient_id },
    });
  }

  async findByDoctorId(
    doctor_id: string,
    actor?: Actor,
  ): Promise<PrescriptionEntity[]> {
    const doctorScope = resolveDoctorScope(actor, doctor_id);
    return this.prescriptionsRepository.find({
      where: { doctor_id: doctorScope ?? doctor_id },
    });
  }

  async findBySessionId(
    session_id: string,
    actor?: Actor,
  ): Promise<PrescriptionEntity | null> {
    const prescription = await this.prescriptionsRepository.findOne({
      where: { session_id },
      order: { created_at: 'DESC' },
      relations: ['items'],
    });
    if (prescription) {
      assertDoctorOwnership(actor, prescription.doctor_id);
    }
    return prescription;
  }

  async findByRecordId(
    record_id: string,
    actor?: Actor,
  ): Promise<PrescriptionEntity[]> {
    const doctorScope = resolveDoctorScope(actor);
    return this.prescriptionsRepository.find({
      where: doctorScope
        ? { record_id, doctor_id: doctorScope }
        : { record_id },
    });
  }

  async update(
    prescription_id: string,
    updatePrescriptionDto: UpdatePrescriptionDto,
    actor?: Actor,
  ): Promise<PrescriptionEntity> {
    const prescription = await this.findOne(prescription_id, actor);
    this.assertPrescriptionMutable(prescription);
    this.assertUpdateDoesNotChangeContext(prescription, updatePrescriptionDto);
    Object.assign(prescription, updatePrescriptionDto);
    return this.prescriptionsRepository.save(prescription);
  }

  async remove(prescription_id: string, actor?: Actor): Promise<void> {
    const prescription = await this.findOne(prescription_id, actor);
    this.assertPrescriptionMutable(prescription);
    await this.prescriptionsRepository.remove(prescription);
  }

  async issue(
    prescription_id: string,
    actor?: Actor,
  ): Promise<PrescriptionEntity> {
    const prescription = await this.findOne(prescription_id, actor);
    this.assertPrescriptionMutable(prescription);

    const items = await this.prescriptionItemsRepository.find({
      where: { prescription_id },
    });
    if (items.length < 1) {
      throw new BadRequestException(
        'At least one medication item is required before issuing a prescription.',
      );
    }
    for (const item of items) {
      this.assertMedicationItemComplete(item);
    }

    const issuedAt = new Date();
    prescription.status = 'issued';
    prescription.issued_at = issuedAt;
    prescription.issued_by = prescription.doctor_id;
    await this.applyPatientIssueSnapshot(prescription, issuedAt);
    return this.prescriptionsRepository.save(prescription);
  }

  async cancel(
    prescription_id: string,
    reason: string,
    actor?: Actor,
  ): Promise<PrescriptionEntity> {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      throw new BadRequestException(
        'A cancellation reason is required to cancel a prescription.',
      );
    }

    const prescription = await this.findOne(prescription_id, actor);
    if (prescription.status === 'cancelled') {
      throw new ConflictException('Prescription is already cancelled.');
    }
    this.assertPrescriptionSessionMutable(prescription);

    prescription.status = 'cancelled';
    prescription.cancelled_at = new Date();
    prescription.cancellation_reason = trimmedReason;
    return this.prescriptionsRepository.save(prescription);
  }

  private async findMutableSession(
    session_id: string,
  ): Promise<ExaminationSessionEntity> {
    const session = await this.examinationSessionsRepository.findOne({
      where: { session_id },
    });
    if (!session) {
      throw new NotFoundException(
        `Examination session with ID ${session_id} not found`,
      );
    }
    if (this.lockedSessionStatuses.includes(session.status)) {
      throw new ConflictException(
        'Finalized examination sessions cannot receive new prescriptions. Create an amendment instead.',
      );
    }
    return session;
  }

  private assertSessionContext(
    dto: CreatePrescriptionDto,
    session: ExaminationSessionEntity,
  ): void {
    const mismatches: string[] = [];
    if (
      dto.patient_id &&
      session.patient_id &&
      dto.patient_id !== session.patient_id
    ) {
      mismatches.push('patient_id');
    }
    if (dto.doctor_id && dto.doctor_id !== session.doctor_id) {
      mismatches.push('doctor_id');
    }
    if (
      dto.record_id &&
      session.record_id &&
      dto.record_id !== session.record_id
    ) {
      mismatches.push('record_id');
    }
    if (mismatches.length) {
      throw new BadRequestException(
        `Prescription context does not match examination session: ${mismatches.join(', ')}.`,
      );
    }
  }

  private assertPrescriptionMutable(prescription: PrescriptionEntity): void {
    if (this.lockedStatuses.includes(prescription.status)) {
      throw new ConflictException(
        'Issued or cancelled prescriptions cannot be updated. Cancel and create a new prescription if needed.',
      );
    }
    this.assertPrescriptionSessionMutable(prescription);
  }

  private assertPrescriptionSessionMutable(
    prescription: PrescriptionEntity,
  ): void {
    const sessionStatus = prescription.session?.status?.toLowerCase();
    if (
      this.lockedSessionStatuses.includes(sessionStatus ?? '') ||
      prescription.session?.signed_at
    ) {
      throw new ConflictException(
        'Finalized examination sessions cannot change prescriptions. Create an amendment instead.',
      );
    }
  }

  private assertUpdateDoesNotChangeContext(
    prescription: PrescriptionEntity,
    dto: UpdatePrescriptionDto,
  ): void {
    const contextFields = [
      'session_id',
      'record_id',
      'patient_id',
      'doctor_id',
    ] as const;

    for (const field of contextFields) {
      const nextValue = dto[field];
      if (nextValue !== undefined && nextValue !== prescription[field]) {
        throw new BadRequestException(`${field} cannot be changed`);
      }
    }

    if (dto.status !== undefined && dto.status !== prescription.status) {
      throw new BadRequestException('status cannot be changed through update');
    }
    if (
      dto.digital_signature_id !== undefined &&
      dto.digital_signature_id !== prescription.digital_signature_id
    ) {
      throw new BadRequestException(
        'digital_signature_id cannot be changed through update',
      );
    }
  }

  private assertMedicationItemComplete(item: PrescriptionItemEntity): void {
    const missingFields: string[] = [];
    if (!item.medication_name?.trim()) missingFields.push('medication_name');
    if (!item.dosage?.trim()) missingFields.push('dosage');
    if (!item.route?.trim()) missingFields.push('route');
    if (!item.frequency?.trim()) missingFields.push('frequency');
    const durationDays = item.duration_days;
    if (
      !Number.isInteger(durationDays) ||
      durationDays === null ||
      durationDays <= 0
    ) {
      missingFields.push('duration_days');
    }
    const quantity = item.quantity;
    if (!Number.isInteger(quantity) || quantity === null || quantity <= 0) {
      missingFields.push('quantity');
    }
    if (!item.instructions?.trim()) missingFields.push('instructions');

    if (missingFields.length) {
      throw new BadRequestException(
        `Prescription item is missing required dosing details: ${missingFields.join(', ')}.`,
      );
    }
  }

  private async applyPatientIssueSnapshot(
    prescription: PrescriptionEntity,
    issuedAt: Date,
  ): Promise<void> {
    const patient = prescription.patient;
    const age = this.calculateAgeAt(patient?.date_of_birth, issuedAt);

    prescription.patient_age_years_at_issue = age?.years ?? null;
    prescription.patient_age_months_at_issue = age?.months ?? null;
    prescription.minor_patient_at_issue = age === null ? null : age.years < 18;

    if (prescription.minor_patient_at_issue !== true) {
      return;
    }

    const representative =
      await this.patientRepresentativesService.findAuthorizedRepresentative(
        prescription.patient_id,
        'treatment',
      );

    prescription.representative_id_snapshot = representative.representative_id;
    prescription.representative_name_snapshot = representative.full_name;
    prescription.representative_relationship_snapshot =
      representative.relationship;
    prescription.representative_phone_snapshot = representative.phone;
  }

  private calculateAgeAt(
    dateOfBirth: Date | string | null | undefined,
    at: Date,
  ): { years: number; months: number } | null {
    if (!dateOfBirth) {
      return null;
    }

    const birthDate =
      dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    let months =
      (at.getFullYear() - birthDate.getFullYear()) * 12 +
      (at.getMonth() - birthDate.getMonth());
    if (at.getDate() < birthDate.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      return null;
    }

    return {
      years: Math.floor(months / 12),
      months,
    };
  }
}
