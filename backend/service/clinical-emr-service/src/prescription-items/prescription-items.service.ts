import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    this.assertMedicationItemComplete(createPrescriptionItemDto);
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
    const nextPrescriptionItem = {
      ...prescriptionItem,
      ...updatePrescriptionItemDto,
    };
    this.assertMedicationItemComplete(nextPrescriptionItem);
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

  private assertMedicationItemComplete(
    item: Partial<PrescriptionItemEntity>,
  ): void {
    const missingFields: string[] = [];
    if (!item.medication_name?.trim()) missingFields.push('medication_name');
    if (!item.dosage?.trim()) missingFields.push('dosage');
    if (!item.route?.trim()) missingFields.push('route');
    if (!item.frequency?.trim()) missingFields.push('frequency');
    if (!Number.isInteger(item.duration_days) || item.duration_days! <= 0) {
      missingFields.push('duration_days');
    }
    if (!Number.isInteger(item.quantity) || item.quantity! <= 0) {
      missingFields.push('quantity');
    }
    if (!item.instructions?.trim()) missingFields.push('instructions');

    if (missingFields.length) {
      throw new BadRequestException(
        `Prescription item is missing required dosing details: ${missingFields.join(', ')}.`,
      );
    }
  }
}
