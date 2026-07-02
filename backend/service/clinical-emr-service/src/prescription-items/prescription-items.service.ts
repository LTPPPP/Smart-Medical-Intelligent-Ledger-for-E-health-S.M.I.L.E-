import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrescriptionItemEntity } from './entities/prescription-item.entity';
import { CreatePrescriptionItemDto } from './dto/create-prescription-item.dto';
import { UpdatePrescriptionItemDto } from './dto/update-prescription-item.dto';
import { PrescriptionEntity } from '../prescriptions/entities/prescription.entity';

@Injectable()
export class PrescriptionItemsService {
  constructor(
    @InjectRepository(PrescriptionItemEntity)
    private prescriptionItemsRepository: Repository<PrescriptionItemEntity>,
    @InjectRepository(PrescriptionEntity)
    private prescriptionsRepository: Repository<PrescriptionEntity>,
  ) {}

  async create(
    createPrescriptionItemDto: CreatePrescriptionItemDto,
  ): Promise<PrescriptionItemEntity> {
    await this.assertPrescriptionEditable(
      createPrescriptionItemDto.prescription_id,
    );
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
    await this.assertPrescriptionEditable(prescriptionItem.prescription_id);
    if (
      updatePrescriptionItemDto.prescription_id &&
      updatePrescriptionItemDto.prescription_id !==
        prescriptionItem.prescription_id
    ) {
      throw new ConflictException('Prescription item cannot be moved.');
    }
    Object.assign(prescriptionItem, updatePrescriptionItemDto);
    return this.prescriptionItemsRepository.save(prescriptionItem);
  }

  async remove(item_id: string): Promise<void> {
    const prescriptionItem = await this.findOne(item_id);
    await this.assertPrescriptionEditable(prescriptionItem.prescription_id);
    await this.prescriptionItemsRepository.remove(prescriptionItem);
  }

  private async assertPrescriptionEditable(
    prescription_id: string,
  ): Promise<void> {
    const prescription = await this.prescriptionsRepository.findOne({
      where: { prescription_id },
      relations: ['session'],
    });
    if (!prescription) {
      throw new NotFoundException(
        `Prescription with ID ${prescription_id} not found`,
      );
    }
    if (prescription.status !== 'draft') {
      throw new ConflictException(
        'Prescription medications are locked after issue or cancellation.',
      );
    }
    const sessionStatus = prescription.session?.status?.toLowerCase();
    if (
      sessionStatus === 'completed' ||
      sessionStatus === 'signed' ||
      prescription.session?.signed_at
    ) {
      throw new ConflictException(
        'Finalized examination sessions cannot receive medication changes. Create an amendment instead.',
      );
    }
  }
}
