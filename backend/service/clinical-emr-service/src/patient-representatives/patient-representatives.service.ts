import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreatePatientRepresentativeDto } from './dto/create-patient-representative.dto';
import { UpdatePatientRepresentativeDto } from './dto/update-patient-representative.dto';
import { PatientRepresentativeEntity } from './entities/patient-representative.entity';
import { PatientsService } from '../patients/patients.service';

export type RepresentativePurpose = 'treatment' | 'payment' | 'records';

@Injectable()
export class PatientRepresentativesService {
  constructor(
    @InjectRepository(PatientRepresentativeEntity)
    private representativesRepository: Repository<PatientRepresentativeEntity>,
    private patientsService: PatientsService,
  ) {}

  async create(
    dto: CreatePatientRepresentativeDto,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<PatientRepresentativeEntity> {
    await this.assertPatientRepresentativeAccess(
      dto.patient_id,
      actorUserId,
      actorRole,
    );
    const fullName = this.normalizeRequired(dto.full_name, 'full_name');
    const relationship = this.normalizeRequired(
      dto.relationship,
      'relationship',
    );
    const phone = this.normalizeRequired(dto.phone, 'phone');
    const authorizedForTreatment = dto.authorized_for_treatment ?? false;
    const authorizedForPayment = dto.authorized_for_payment ?? false;
    const authorizedForRecords = dto.authorized_for_records ?? false;

    if (
      !authorizedForTreatment &&
      !authorizedForPayment &&
      !authorizedForRecords
    ) {
      throw new BadRequestException(
        'At least one representative authorization scope is required',
      );
    }

    const representative = this.representativesRepository.create({
      patient_id: dto.patient_id,
      full_name: fullName,
      relationship,
      phone,
      email: this.normalizeOptional(dto.email),
      legal_document_type: this.normalizeOptional(dto.legal_document_type),
      legal_document_number: this.normalizeOptional(dto.legal_document_number),
      is_primary: dto.is_primary ?? false,
      is_active: true,
      authorized_for_treatment: authorizedForTreatment,
      authorized_for_payment: authorizedForPayment,
      authorized_for_records: authorizedForRecords,
      verified_at: null,
      verified_by: null,
    });

    if (representative.is_primary && representative.is_active) {
      await this.demoteOtherPrimaryRepresentatives(dto.patient_id);
    }

    return this.representativesRepository.save(representative);
  }

  async findByPatient(
    patientId: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<PatientRepresentativeEntity[]> {
    await this.assertPatientRepresentativeAccess(
      patientId,
      actorUserId,
      actorRole,
    );
    return this.representativesRepository.find({
      where: { patient_id: patientId, is_active: true },
      order: { is_primary: 'DESC', verified_at: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(
    id: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<PatientRepresentativeEntity> {
    const representative = await this.representativesRepository.findOne({
      where: { representative_id: id },
    });

    if (!representative) {
      throw new NotFoundException('Patient representative not found');
    }

    await this.assertPatientRepresentativeAccess(
      representative.patient_id,
      actorUserId,
      actorRole,
    );

    return representative;
  }

  async update(
    id: string,
    dto: UpdatePatientRepresentativeDto,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<PatientRepresentativeEntity> {
    const representative = await this.findOne(id, actorUserId, actorRole);

    if (dto.full_name !== undefined) {
      representative.full_name = this.normalizeRequired(
        dto.full_name,
        'full_name',
      );
    }
    if (dto.relationship !== undefined) {
      representative.relationship = this.normalizeRequired(
        dto.relationship,
        'relationship',
      );
    }
    if (dto.phone !== undefined) {
      representative.phone = this.normalizeRequired(dto.phone, 'phone');
    }
    if (dto.email !== undefined) {
      representative.email = this.normalizeOptional(dto.email);
    }
    if (dto.legal_document_type !== undefined) {
      representative.legal_document_type = this.normalizeOptional(
        dto.legal_document_type,
      );
    }
    if (dto.legal_document_number !== undefined) {
      representative.legal_document_number = this.normalizeOptional(
        dto.legal_document_number,
      );
    }
    if (dto.is_primary !== undefined) {
      representative.is_primary = dto.is_primary;
    }
    if (dto.is_active !== undefined) {
      representative.is_active = dto.is_active;
    }
    if (dto.authorized_for_treatment !== undefined) {
      representative.authorized_for_treatment = dto.authorized_for_treatment;
    }
    if (dto.authorized_for_payment !== undefined) {
      representative.authorized_for_payment = dto.authorized_for_payment;
    }
    if (dto.authorized_for_records !== undefined) {
      representative.authorized_for_records = dto.authorized_for_records;
    }

    this.assertAuthorizationScope(representative);
    if (representative.is_primary && representative.is_active) {
      await this.demoteOtherPrimaryRepresentatives(
        representative.patient_id,
        representative.representative_id,
      );
    }

    return this.representativesRepository.save(representative);
  }

  async verify(
    id: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<PatientRepresentativeEntity> {
    const representative = await this.findOne(id, actorUserId, actorRole);
    if (!actorUserId || !this.isClinicalRepresentativeRole(actorRole)) {
      throw new ForbiddenException(
        'A trusted clinical staff role is required to verify patient representatives.',
      );
    }
    representative.verified_by = actorUserId;
    representative.verified_at = new Date();
    return this.representativesRepository.save(representative);
  }

  async findAuthorizedRepresentative(
    patientId: string,
    purpose: RepresentativePurpose,
  ): Promise<PatientRepresentativeEntity> {
    const representative = await this.representativesRepository.findOne({
      where: {
        patient_id: patientId,
        is_active: true,
        is_primary: true,
        [this.authorizationField(purpose)]: true,
      },
      order: { verified_at: 'DESC', created_at: 'DESC' },
    });

    if (!representative?.verified_at) {
      throw new NotFoundException(
        `No verified legal representative authorized for ${purpose}`,
      );
    }

    return representative;
  }

  private authorizationField(
    purpose: RepresentativePurpose,
  ): keyof PatientRepresentativeEntity {
    if (purpose === 'payment') return 'authorized_for_payment';
    if (purpose === 'records') return 'authorized_for_records';
    return 'authorized_for_treatment';
  }

  private async demoteOtherPrimaryRepresentatives(
    patientId: string,
    excludeRepresentativeId?: string,
  ): Promise<void> {
    await this.representativesRepository.update(
      {
        patient_id: patientId,
        is_active: true,
        is_primary: true,
        ...(excludeRepresentativeId
          ? { representative_id: Not(excludeRepresentativeId) }
          : {}),
      },
      { is_primary: false },
    );
  }

  private normalizeActorRole(actorRole?: string): string | undefined {
    return actorRole?.trim().toUpperCase();
  }

  private isClinicalRepresentativeRole(actorRole?: string): boolean {
    return ['ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR'].includes(
      this.normalizeActorRole(actorRole) ?? '',
    );
  }

  private async resolveActorPatientId(
    actorUserId?: string,
  ): Promise<string | null> {
    if (!actorUserId) {
      return null;
    }
    const patient = await this.patientsService.findByUserId(actorUserId);
    return patient?.patient_id ?? null;
  }

  private async assertPatientRepresentativeAccess(
    patientId: string,
    actorUserId?: string,
    actorRole?: string,
  ): Promise<void> {
    if (!actorUserId) {
      throw new ForbiddenException(
        'A trusted patient, doctor, or staff role is required for patient representative records.',
      );
    }

    const actorPatientId = await this.resolveActorPatientId(actorUserId);
    if (actorPatientId) {
      if (actorPatientId !== patientId) {
        throw new ForbiddenException(
          'The authenticated patient can only access their own representative records.',
        );
      }
      return;
    }

    if (!this.isClinicalRepresentativeRole(actorRole)) {
      throw new ForbiddenException(
        'A trusted patient, doctor, or staff role is required for patient representative records.',
      );
    }
  }

  private assertAuthorizationScope(
    representative: Pick<
      PatientRepresentativeEntity,
      | 'is_active'
      | 'authorized_for_treatment'
      | 'authorized_for_payment'
      | 'authorized_for_records'
    >,
  ) {
    if (!representative.is_active) {
      return;
    }
    if (
      !representative.authorized_for_treatment &&
      !representative.authorized_for_payment &&
      !representative.authorized_for_records
    ) {
      throw new BadRequestException(
        'At least one representative authorization scope is required',
      );
    }
  }

  private normalizeRequired(value: string, field: string): string {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new BadRequestException(`${field} is required`);
    }
    return trimmed;
  }

  private normalizeOptional(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed || null;
  }
}
