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
      throw new BadRequestException(
        'New prescriptions must start as draft.',
      );
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

  async findAll(): Promise<PrescriptionEntity[]> {
    return this.prescriptionsRepository.find();
  }

  async findOne(prescription_id: string): Promise<PrescriptionEntity> {
    const prescription = await this.prescriptionsRepository.findOne({
      where: { prescription_id },
      relations: ['session'],
    });
    if (!prescription) {
      throw new NotFoundException(
        `Prescription with ID ${prescription_id} not found`,
      );
    }
    return prescription;
  }

  async findByPatientId(patient_id: string): Promise<PrescriptionEntity[]> {
    return this.prescriptionsRepository.find({
      where: { patient_id },
    });
  }

  async findByDoctorId(doctor_id: string): Promise<PrescriptionEntity[]> {
    return this.prescriptionsRepository.find({
      where: { doctor_id },
    });
  }

  async findByRecordId(record_id: string): Promise<PrescriptionEntity[]> {
    return this.prescriptionsRepository.find({
      where: { record_id },
    });
  }

  async update(
    prescription_id: string,
    updatePrescriptionDto: UpdatePrescriptionDto,
  ): Promise<PrescriptionEntity> {
    const prescription = await this.findOne(prescription_id);
    this.assertPrescriptionMutable(prescription);
    this.assertUpdateDoesNotChangeContext(prescription, updatePrescriptionDto);
    Object.assign(prescription, updatePrescriptionDto);
    return this.prescriptionsRepository.save(prescription);
  }

  async remove(prescription_id: string): Promise<void> {
    const prescription = await this.findOne(prescription_id);
    this.assertPrescriptionMutable(prescription);
    await this.prescriptionsRepository.remove(prescription);
  }

  async issue(prescription_id: string): Promise<PrescriptionEntity> {
    const prescription = await this.findOne(prescription_id);
    this.assertPrescriptionMutable(prescription);

    const itemCount = await this.prescriptionItemsRepository.count({
      where: { prescription_id },
    });
    if (itemCount < 1) {
      throw new BadRequestException(
        'At least one medication item is required before issuing a prescription.',
      );
    }

    const issuedAt = new Date();
    prescription.status = 'issued';
    prescription.issued_at = issuedAt;
    prescription.issued_by = prescription.doctor_id;
    return this.prescriptionsRepository.save(prescription);
  }

  async cancel(
    prescription_id: string,
    reason: string,
  ): Promise<PrescriptionEntity> {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      throw new BadRequestException(
        'A cancellation reason is required to cancel a prescription.',
      );
    }

    const prescription = await this.findOne(prescription_id);
    if (prescription.status === 'cancelled') {
      throw new ConflictException('Prescription is already cancelled.');
    }

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
}
