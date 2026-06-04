import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabTestResultEntity } from './entities/lab-test-result.entity';
import { CreateLabTestResultDto } from './dto/create-lab-test-result.dto';
import { UpdateLabTestResultDto } from './dto/update-lab-test-result.dto';

@Injectable()
export class LabTestResultsService {
  constructor(
    @InjectRepository(LabTestResultEntity)
    private labTestResultsRepository: Repository<LabTestResultEntity>,
  ) {}

  async create(
    createLabTestResultDto: CreateLabTestResultDto,
  ): Promise<LabTestResultEntity> {
    const labTestResult = this.labTestResultsRepository.create(
      createLabTestResultDto,
    );
    return this.labTestResultsRepository.save(labTestResult);
  }

  async findAll(): Promise<LabTestResultEntity[]> {
    return this.labTestResultsRepository.find();
  }

  async findOne(result_id: string): Promise<LabTestResultEntity> {
    const labTestResult = await this.labTestResultsRepository.findOne({
      where: { result_id },
    });
    if (!labTestResult) {
      throw new NotFoundException(
        `Lab test result with ID ${result_id} not found`,
      );
    }
    return labTestResult;
  }

  async findByOrderId(order_id: string): Promise<LabTestResultEntity[]> {
    return this.labTestResultsRepository.find({
      where: { order_id },
    });
  }

  async findAbnormalResults(): Promise<LabTestResultEntity[]> {
    return this.labTestResultsRepository.find({
      where: { is_abnormal: true },
    });
  }

  async update(
    result_id: string,
    updateLabTestResultDto: UpdateLabTestResultDto,
  ): Promise<LabTestResultEntity> {
    const labTestResult = await this.findOne(result_id);
    Object.assign(labTestResult, updateLabTestResultDto);
    return this.labTestResultsRepository.save(labTestResult);
  }

  async remove(result_id: string): Promise<void> {
    const labTestResult = await this.findOne(result_id);
    await this.labTestResultsRepository.remove(labTestResult);
  }
}
