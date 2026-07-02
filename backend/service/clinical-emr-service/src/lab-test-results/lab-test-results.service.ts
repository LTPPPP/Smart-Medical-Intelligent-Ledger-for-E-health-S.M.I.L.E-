import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabTestResultEntity } from './entities/lab-test-result.entity';
import { CreateLabTestResultDto } from './dto/create-lab-test-result.dto';
import { UpdateLabTestResultDto } from './dto/update-lab-test-result.dto';
import { ClinicalOrderEntity } from '../clinical-orders/entities/clinical-order.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';

@Injectable()
export class LabTestResultsService {
  constructor(
    @InjectRepository(LabTestResultEntity)
    private labTestResultsRepository: Repository<LabTestResultEntity>,
    @InjectRepository(ClinicalOrderEntity)
    private clinicalOrdersRepository: Repository<ClinicalOrderEntity>,
    @InjectRepository(ExaminationSessionEntity)
    private sessionsRepository: Repository<ExaminationSessionEntity>,
  ) {}

  async create(
    createLabTestResultDto: CreateLabTestResultDto,
  ): Promise<LabTestResultEntity> {
    const order = await this.findClinicalOrder(createLabTestResultDto.order_id);
    await this.assertLinkedSessionMutable(order);

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
    this.assertOrderUnchanged(labTestResult, updateLabTestResultDto);
    const order = await this.findClinicalOrder(labTestResult.order_id);
    await this.assertLinkedSessionMutable(order);

    Object.assign(labTestResult, updateLabTestResultDto);
    return this.labTestResultsRepository.save(labTestResult);
  }

  async remove(result_id: string): Promise<void> {
    const labTestResult = await this.findOne(result_id);
    const order = await this.findClinicalOrder(labTestResult.order_id);
    await this.assertLinkedSessionMutable(order);
    await this.labTestResultsRepository.remove(labTestResult);
  }

  private async findClinicalOrder(
    order_id: string,
  ): Promise<ClinicalOrderEntity> {
    const order = await this.clinicalOrdersRepository.findOne({
      where: { order_id },
    });
    if (!order) {
      throw new NotFoundException(
        `Clinical order with ID ${order_id} not found`,
      );
    }
    return order;
  }

  private async assertLinkedSessionMutable(
    order: ClinicalOrderEntity,
  ): Promise<void> {
    if (!order.session_id) {
      return;
    }

    const session = await this.sessionsRepository.findOne({
      where: { session_id: order.session_id },
    });
    if (!session) {
      throw new NotFoundException(
        `Examination session with ID ${order.session_id} not found`,
      );
    }

    const status = session.status?.toLowerCase();
    if (status === 'completed' || session.signed_at) {
      throw new ConflictException('Finalized examination sessions are locked');
    }
  }

  private assertOrderUnchanged(
    labTestResult: LabTestResultEntity,
    dto: UpdateLabTestResultDto,
  ): void {
    if (dto.order_id !== undefined && dto.order_id !== labTestResult.order_id) {
      throw new BadRequestException('order_id cannot be changed');
    }
  }
}
