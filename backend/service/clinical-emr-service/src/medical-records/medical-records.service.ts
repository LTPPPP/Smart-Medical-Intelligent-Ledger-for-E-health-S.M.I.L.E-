import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecordEntity } from './entities/medical-record.entity';
import { MedicalRecordVersionEntity } from './entities/medical-record-version.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { RecordStatus } from '../utils/enums/record-status.enum';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectRepository(MedicalRecordEntity)
    private recordsRepository: Repository<MedicalRecordEntity>,
    @InjectRepository(MedicalRecordVersionEntity)
    private versionsRepository: Repository<MedicalRecordVersionEntity>,
  ) {}

  async create(dto: CreateMedicalRecordDto) {
    if (dto.record_status && dto.record_status !== RecordStatus.DRAFT) {
      throw new BadRequestException('Medical records must start as draft');
    }
    return this.recordsRepository.save(
      this.recordsRepository.create({
        ...dto,
        record_status: RecordStatus.DRAFT,
      }),
    );
  }

  findAll() {
    return this.recordsRepository.find();
  }

  findByPatient(patient_id: string) {
    return this.recordsRepository.find({ where: { patient_id } });
  }

  // Only Finalized Records
  findMineList(patient_id: string) {
    return this.recordsRepository.find({
      where: { patient_id, record_status: RecordStatus.FINALIZED },
      order: { visit_date: 'DESC' },
    });
  }

  async findMineDetail(patient_id: string, record_id: string) {
    const item = await this.findOne(record_id);
    if (
      item.patient_id !== patient_id ||
      item.record_status !== RecordStatus.FINALIZED
    ) {
      throw new NotFoundException(`Record ${record_id} not found`);
    }
    return item;
  }

  async findOne(record_id: string) {
    const item = await this.recordsRepository.findOne({ where: { record_id } });
    if (!item) throw new NotFoundException(`Record ${record_id} not found`);
    return item;
  }

  async update(record_id: string, dto: UpdateMedicalRecordDto) {
    const item = await this.findOne(record_id);
    this.assertMutable(item);
    this.assertUpdateDoesNotChangeContext(item, dto);
    Object.assign(item, dto);
    return this.recordsRepository.save(item);
  }

  async remove(record_id: string) {
    const item = await this.findOne(record_id);
    this.assertMutable(item);
    return this.recordsRepository.remove(item);
  }

  getVersions(record_id: string) {
    return this.versionsRepository.find({ where: { record_id } });
  }

  async finalize(record_id: string, finalized_by?: string) {
    const item = await this.findOne(record_id);
    if (this.isFinalized(item)) {
      throw new ConflictException('Medical record is already finalized.');
    }

    const finalizedAt = new Date();
    item.record_status = RecordStatus.FINALIZED;
    item.finalized_at = finalizedAt;
    item.finalized_by = finalized_by ?? item.doctor_id;

    const saved = await this.recordsRepository.save(item);
    await this.createVersion(
      record_id,
      { ...saved },
      saved.finalized_by ?? saved.doctor_id,
      'Medical record finalized',
    );
    return saved;
  }

  async createVersion(
    record_id: string,
    snapshot: Record<string, unknown>,
    changed_by: string,
    change_reason?: string,
  ) {
    const latestVersion = await this.versionsRepository.findOne({
      where: { record_id },
      order: { version_number: 'DESC' },
    });
    const versionNumber = (latestVersion?.version_number ?? 0) + 1;
    return this.versionsRepository.save(
      this.versionsRepository.create({
        record_id,
        version_number: versionNumber,
        snapshot,
        changed_by,
        change_reason,
      }),
    );
  }

  private assertMutable(record: MedicalRecordEntity): void {
    if (this.isFinalized(record)) {
      throw new ConflictException(
        'Finalized medical records cannot be changed. Create an amendment instead.',
      );
    }
  }

  private assertUpdateDoesNotChangeContext(
    record: MedicalRecordEntity,
    dto: UpdateMedicalRecordDto,
  ): void {
    this.assertUnchanged(
      dto,
      record,
      'patient_id',
      'patient_id cannot be changed',
    );
    this.assertUnchanged(
      dto,
      record,
      'appointment_id',
      'appointment_id cannot be changed',
    );
    this.assertUnchanged(
      dto,
      record,
      'clinic_id',
      'clinic_id cannot be changed',
    );
    this.assertUnchanged(
      dto,
      record,
      'doctor_id',
      'doctor_id cannot be changed',
    );
    this.assertUnchanged(
      dto,
      record,
      'visit_date',
      'visit_date cannot be changed',
    );
    this.assertUnchanged(
      dto,
      record,
      'record_status',
      'record_status cannot be changed',
    );
    this.assertUnchanged(
      dto,
      record,
      'record_hash',
      'record_hash cannot be changed',
    );
    this.assertUnchanged(
      dto,
      record,
      'finalized_at',
      'finalized_at cannot be changed',
    );
    this.assertUnchanged(
      dto,
      record,
      'finalized_by',
      'finalized_by cannot be changed',
    );
  }

  private assertUnchanged(
    dto: UpdateMedicalRecordDto,
    record: MedicalRecordEntity,
    field: string,
    message: string,
  ): void {
    const next = (dto as Record<string, unknown>)[field];
    if (next === undefined) {
      return;
    }

    const current = (record as unknown as Record<string, unknown>)[field];
    if (this.normalizedValue(next) !== this.normalizedValue(current)) {
      throw new BadRequestException(message);
    }
  }

  private normalizedValue(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value ?? '');
  }

  private isFinalized(record: MedicalRecordEntity): boolean {
    return (
      record.record_status === RecordStatus.FINALIZED ||
      Boolean(record.finalized_at)
    );
  }
}
