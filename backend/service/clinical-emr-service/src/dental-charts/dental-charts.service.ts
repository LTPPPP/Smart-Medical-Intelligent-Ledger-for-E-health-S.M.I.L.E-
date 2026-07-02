import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DentalChartEntity } from './entities/dental-chart.entity';
import { CreateDentalChartDto } from './dto/create-dental-chart.dto';
import { UpdateDentalChartDto } from './dto/update-dental-chart.dto';
import { MedicalRecordEntity } from '../medical-records/entities/medical-record.entity';

@Injectable()
export class DentalChartsService {
  private readonly lockedRecordStatuses = ['finalized', 'completed', 'signed'];

  constructor(
    @InjectRepository(DentalChartEntity)
    private dentalChartsRepository: Repository<DentalChartEntity>,
    @InjectRepository(MedicalRecordEntity)
    private medicalRecordsRepository: Repository<MedicalRecordEntity>,
  ) {}

  async create(
    createDentalChartDto: CreateDentalChartDto,
  ): Promise<DentalChartEntity> {
    if (!createDentalChartDto.record_id) {
      throw new BadRequestException(
        'record_id is required to create a dental chart.',
      );
    }

    const record = await this.findMutableRecord(createDentalChartDto.record_id);
    this.assertRecordPatientContext(createDentalChartDto.patient_id, record);

    const dentalChart =
      this.dentalChartsRepository.create(createDentalChartDto);
    return this.dentalChartsRepository.save(dentalChart);
  }

  async findAll(): Promise<DentalChartEntity[]> {
    return this.dentalChartsRepository.find();
  }

  async findOne(chart_id: string): Promise<DentalChartEntity> {
    const dentalChart = await this.dentalChartsRepository.findOne({
      where: { chart_id },
    });
    if (!dentalChart) {
      throw new NotFoundException(`Dental chart with ID ${chart_id} not found`);
    }
    return dentalChart;
  }

  async findByPatientId(patient_id: string): Promise<DentalChartEntity[]> {
    return this.dentalChartsRepository.find({
      where: { patient_id },
    });
  }

  async findByRecordId(record_id: string): Promise<DentalChartEntity[]> {
    return this.dentalChartsRepository.find({
      where: { record_id },
    });
  }

  async update(
    chart_id: string,
    updateDentalChartDto: UpdateDentalChartDto,
  ): Promise<DentalChartEntity> {
    const dentalChart = await this.findOne(chart_id);
    await this.findMutableRecord(dentalChart.record_id);
    this.assertContextUnchanged(dentalChart, updateDentalChartDto);
    Object.assign(dentalChart, updateDentalChartDto);
    return this.dentalChartsRepository.save(dentalChart);
  }

  async remove(chart_id: string): Promise<void> {
    const dentalChart = await this.findOne(chart_id);
    await this.findMutableRecord(dentalChart.record_id);
    await this.dentalChartsRepository.remove(dentalChart);
  }

  private async findMutableRecord(
    record_id: string,
  ): Promise<MedicalRecordEntity> {
    const record = await this.medicalRecordsRepository.findOne({
      where: { record_id },
    });
    if (!record) {
      throw new NotFoundException(
        `Medical record with ID ${record_id} not found`,
      );
    }
    if (
      this.lockedRecordStatuses.includes(record.record_status) ||
      record.finalized_at
    ) {
      throw new ConflictException(
        'Finalized medical records cannot change dental charts. Create an amendment instead.',
      );
    }
    return record;
  }

  private assertRecordPatientContext(
    patient_id: string,
    record: MedicalRecordEntity,
  ): void {
    if (patient_id !== record.patient_id) {
      throw new BadRequestException(
        'Dental chart patient does not match medical record.',
      );
    }
  }

  private assertContextUnchanged(
    dentalChart: DentalChartEntity,
    updateDentalChartDto: UpdateDentalChartDto,
  ): void {
    const contextFields = ['patient_id', 'record_id', 'tooth_number'] as const;

    for (const field of contextFields) {
      const nextValue = updateDentalChartDto[field];
      if (nextValue !== undefined && nextValue !== dentalChart[field]) {
        throw new BadRequestException(`${field} cannot be changed`);
      }
    }
  }
}
