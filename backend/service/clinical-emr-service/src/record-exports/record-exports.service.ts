import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordExportEntity } from './entities/record-export.entity';
import { CreateRecordExportDto } from './dto/create-record-export.dto';
import { UpdateRecordExportDto } from './dto/update-record-export.dto';
import { MedicalRecordEntity } from '../medical-records/entities/medical-record.entity';

@Injectable()
export class RecordExportsService {
  constructor(
    @InjectRepository(RecordExportEntity)
    private recordExportsRepository: Repository<RecordExportEntity>,
    @InjectRepository(MedicalRecordEntity)
    private medicalRecordsRepository: Repository<MedicalRecordEntity>,
  ) {}

  async create(
    createRecordExportDto: CreateRecordExportDto,
  ): Promise<RecordExportEntity> {
    const record = await this.findMedicalRecord(
      createRecordExportDto.record_id,
    );
    this.assertRecordPatient(record, createRecordExportDto.patient_id);
    this.assertRecordFinalized(record);

    const recordExport = this.recordExportsRepository.create(
      createRecordExportDto,
    );
    return this.recordExportsRepository.save(recordExport);
  }

  async findAll(): Promise<RecordExportEntity[]> {
    return this.recordExportsRepository.find();
  }

  async findOne(export_id: string): Promise<RecordExportEntity> {
    const recordExport = await this.recordExportsRepository.findOne({
      where: { export_id },
    });
    if (!recordExport) {
      throw new NotFoundException(
        `Record export with ID ${export_id} not found`,
      );
    }
    return recordExport;
  }

  async findByRecordId(record_id: string): Promise<RecordExportEntity[]> {
    return this.recordExportsRepository.find({
      where: { record_id },
    });
  }

  async update(
    export_id: string,
    updateRecordExportDto: UpdateRecordExportDto,
  ): Promise<RecordExportEntity> {
    const recordExport = await this.findOne(export_id);
    this.assertImmutableContext(recordExport, updateRecordExportDto);
    Object.assign(recordExport, updateRecordExportDto);
    return this.recordExportsRepository.save(recordExport);
  }

  async remove(export_id: string): Promise<void> {
    const recordExport = await this.findOne(export_id);
    await this.recordExportsRepository.remove(recordExport);
  }

  private async findMedicalRecord(
    record_id: string,
  ): Promise<MedicalRecordEntity> {
    const record = await this.medicalRecordsRepository.findOne({
      where: { record_id },
    });
    if (!record) {
      throw new NotFoundException(`Record ${record_id} not found`);
    }
    return record;
  }

  private assertRecordPatient(
    record: MedicalRecordEntity,
    patient_id: string,
  ): void {
    if (record.patient_id !== patient_id) {
      throw new BadRequestException(
        'patient_id must match the medical record patient',
      );
    }
  }

  private assertRecordFinalized(record: MedicalRecordEntity): void {
    if (record.record_status !== 'finalized' && !record.finalized_at) {
      throw new ConflictException(
        'Medical record must be finalized before export',
      );
    }
  }

  private assertImmutableContext(
    recordExport: RecordExportEntity,
    dto: UpdateRecordExportDto,
  ): void {
    if (
      dto.patient_id !== undefined &&
      dto.patient_id !== recordExport.patient_id
    ) {
      throw new BadRequestException('patient_id cannot be changed');
    }
    if (
      dto.record_id !== undefined &&
      dto.record_id !== recordExport.record_id
    ) {
      throw new BadRequestException('record_id cannot be changed');
    }
    if (
      dto.exported_by !== undefined &&
      dto.exported_by !== recordExport.exported_by
    ) {
      throw new BadRequestException('exported_by cannot be changed');
    }
  }
}
