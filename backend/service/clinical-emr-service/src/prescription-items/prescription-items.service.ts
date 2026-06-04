import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrescriptionItemEntity } from './entities/prescription-item.entity';
import { CreatePrescriptionItemDto } from './dto/create-prescription-item.dto';
import { UpdatePrescriptionItemDto } from './dto/update-prescription-item.dto';

@Injectable()
export class PrescriptionItemsService {
  constructor(
    @InjectRepository(PrescriptionItemEntity)
    private prescriptionItemsRepository: Repository<PrescriptionItemEntity>,
  ) {}

  async create(
    createPrescriptionItemDto: CreatePrescriptionItemDto,
  ): Promise<PrescriptionItemEntity> {
    const prescriptionItem = this.prescriptionItemsRepository.create(
      createPrescriptionItemDto,
    );
    return this.prescriptionItemsRepository.save(prescriptionItem);
  }

  async findAll(): Promise<PrescriptionItemEntity[]> {
    return this.prescriptionItemsRepository.find();
  }

  async findOne(item_id: string): Promise<PrescriptionItemEntity> {
    const prescriptionItem = await this.prescriptionItemsRepository.findOne({
      where: { item_id },
    });
    if (!prescriptionItem) {
      throw new NotFoundException(
        `Prescription item with ID ${item_id} not found`,
      );
    }
    return prescriptionItem;
  }

  async findByPrescriptionId(
    prescription_id: string,
  ): Promise<PrescriptionItemEntity[]> {
    return this.prescriptionItemsRepository.find({
      where: { prescription_id },
    });
  }

  async update(
    item_id: string,
    updatePrescriptionItemDto: UpdatePrescriptionItemDto,
  ): Promise<PrescriptionItemEntity> {
    const prescriptionItem = await this.findOne(item_id);
    Object.assign(prescriptionItem, updatePrescriptionItemDto);
    return this.prescriptionItemsRepository.save(prescriptionItem);
  }

  async remove(item_id: string): Promise<void> {
    const prescriptionItem = await this.findOne(item_id);
    await this.prescriptionItemsRepository.remove(prescriptionItem);
  }
}
