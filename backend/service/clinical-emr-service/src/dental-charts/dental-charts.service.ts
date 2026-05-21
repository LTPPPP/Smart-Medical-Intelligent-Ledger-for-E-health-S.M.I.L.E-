import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DentalChartEntity } from './entities/dental-chart.entity';
import { CreateDentalChartDto } from './dto/create-dental-chart.dto';
import { UpdateDentalChartDto } from './dto/update-dental-chart.dto';

@Injectable()
export class DentalChartsService {
  constructor(
    @InjectRepository(DentalChartEntity)
    private dentalChartsRepository: Repository<DentalChartEntity>,
  ) {}

  async create(
    createDentalChartDto: CreateDentalChartDto,
  ): Promise<DentalChartEntity> {
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
    Object.assign(dentalChart, updateDentalChartDto);
    return this.dentalChartsRepository.save(dentalChart);
  }

  async remove(chart_id: string): Promise<void> {
    const dentalChart = await this.findOne(chart_id);
    await this.dentalChartsRepository.remove(dentalChart);
  }
}
