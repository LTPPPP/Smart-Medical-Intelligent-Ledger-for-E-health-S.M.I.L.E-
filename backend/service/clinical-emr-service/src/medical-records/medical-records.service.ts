import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecordEntity } from './entities/medical-record.entity';
import { MedicalRecordVersionEntity } from './entities/medical-record-version.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectRepository(MedicalRecordEntity)
    private recordsRepository: Repository<MedicalRecordEntity>,
    @InjectRepository(MedicalRecordVersionEntity)
    private versionsRepository: Repository<MedicalRecordVersionEntity>,
  ) {}

  create(dto: CreateMedicalRecordDto) {
    return this.recordsRepository.save(this.recordsRepository.create(dto));
  }

  findAll() {
    return this.recordsRepository.find();
  }

  findByPatient(patient_id: string) {
    return this.recordsRepository.find({ where: { patient_id } });
  }

  async findOne(record_id: string) {
    const item = await this.recordsRepository.findOne({ where: { record_id } });
    if (!item) throw new NotFoundException(`Record ${record_id} not found`);
    return item;
  }

  async update(record_id: string, dto: UpdateMedicalRecordDto) {
    const item = await this.findOne(record_id);
    Object.assign(item, dto);
    return this.recordsRepository.save(item);
  }

  async remove(record_id: string) {
    const item = await this.findOne(record_id);
    return this.recordsRepository.remove(item);
  }

  getVersions(record_id: string) {
    return this.versionsRepository.find({ where: { record_id } });
  }

  createVersion(
    record_id: string,
    snapshot: Record<string, unknown>,
    changed_by: string,
    change_reason?: string,
  ) {
    const versionNumber = 1;
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
}
