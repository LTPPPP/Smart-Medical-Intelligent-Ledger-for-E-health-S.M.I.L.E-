import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalOrderEntity } from './entities/clinical-order.entity';
import { CreateClinicalOrderDto } from './dto/create-clinical-order.dto';
import { UpdateClinicalOrderDto } from './dto/update-clinical-order.dto';

@Injectable()
export class ClinicalOrdersService {
  constructor(
    @InjectRepository(ClinicalOrderEntity)
    private clinicalOrdersRepository: Repository<ClinicalOrderEntity>,
  ) {}

  async create(
    createClinicalOrderDto: CreateClinicalOrderDto,
  ): Promise<ClinicalOrderEntity> {
    const clinicalOrder =
      this.clinicalOrdersRepository.create(createClinicalOrderDto);
    return this.clinicalOrdersRepository.save(clinicalOrder);
  }

  async findAll(): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find();
  }

  async findOne(order_id: string): Promise<ClinicalOrderEntity> {
    const clinicalOrder = await this.clinicalOrdersRepository.findOne({
      where: { order_id },
    });
    if (!clinicalOrder) {
      throw new NotFoundException(
        `Clinical order with ID ${order_id} not found`,
      );
    }
    return clinicalOrder;
  }

  async findByPatientId(patient_id: string): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find({
      where: { patient_id },
    });
  }

  async findByRecordId(record_id: string): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find({
      where: { record_id },
    });
  }

  async findByOrderedBy(ordered_by: string): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find({
      where: { ordered_by },
    });
  }

  async findByStatus(status: string): Promise<ClinicalOrderEntity[]> {
    return this.clinicalOrdersRepository.find({
      where: { status },
    });
  }

  async update(
    order_id: string,
    updateClinicalOrderDto: UpdateClinicalOrderDto,
  ): Promise<ClinicalOrderEntity> {
    const clinicalOrder = await this.findOne(order_id);
    Object.assign(clinicalOrder, updateClinicalOrderDto);
    return this.clinicalOrdersRepository.save(clinicalOrder);
  }

  async remove(order_id: string): Promise<void> {
    const clinicalOrder = await this.findOne(order_id);
    await this.clinicalOrdersRepository.remove(clinicalOrder);
  }
}
