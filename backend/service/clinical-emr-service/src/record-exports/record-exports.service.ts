import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordExportEntity } from './entities/record-export.entity';
import { CreateRecordExportDto } from './dto/create-record-export.dto';
import { UpdateRecordExportDto } from './dto/update-record-export.dto';

@Injectable()
export class RecordExportsService {
  constructor(
    @InjectRepository(RecordExportEntity)
    private recordExportsRepository: Repository<RecordExportEntity>,
  ) {}

  async create(
    createRecordExportDto: CreateRecordExportDto,
  ): Promise<RecordExportEntity> {
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
    Object.assign(recordExport, updateRecordExportDto);
    return this.recordExportsRepository.save(recordExport);
  }

  async remove(export_id: string): Promise<void> {
    const recordExport = await this.findOne(export_id);
    await this.recordExportsRepository.remove(recordExport);
  }
}
