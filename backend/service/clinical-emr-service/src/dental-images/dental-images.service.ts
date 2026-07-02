import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DentalImageEntity } from './entities/dental-image.entity';
import { CreateDentalImageDto } from './dto/create-dental-image.dto';
import { UpdateDentalImageDto } from './dto/update-dental-image.dto';
import { MedicalRecordEntity } from '../medical-records/entities/medical-record.entity';

@Injectable()
export class DentalImagesService {
  private readonly lockedRecordStatuses = ['finalized', 'completed', 'signed'];

  constructor(
    @InjectRepository(DentalImageEntity)
    private dentalImagesRepository: Repository<DentalImageEntity>,
    @InjectRepository(MedicalRecordEntity)
    private medicalRecordsRepository: Repository<MedicalRecordEntity>,
  ) {}

  async create(
    createDentalImageDto: CreateDentalImageDto,
  ): Promise<DentalImageEntity> {
    if (createDentalImageDto.record_id) {
      const record = await this.findMutableRecord(createDentalImageDto.record_id);
      this.assertRecordPatientContext(createDentalImageDto.patient_id, record);
    }

    const dentalImage =
      this.dentalImagesRepository.create(createDentalImageDto);
    return this.dentalImagesRepository.save(dentalImage);
  }

  async findAll(): Promise<DentalImageEntity[]> {
    return this.dentalImagesRepository.find();
  }

  async findOne(image_id: string): Promise<DentalImageEntity> {
    const dentalImage = await this.dentalImagesRepository.findOne({
      where: { image_id },
    });
    if (!dentalImage) {
      throw new NotFoundException(`Dental image with ID ${image_id} not found`);
    }
    return dentalImage;
  }

  async findByPatientId(patient_id: string): Promise<DentalImageEntity[]> {
    return this.dentalImagesRepository.find({
      where: { patient_id },
    });
  }

  async findByRecordId(record_id: string): Promise<DentalImageEntity[]> {
    return this.dentalImagesRepository.find({
      where: { record_id },
    });
  }

  async findByCategoryId(category_id: string): Promise<DentalImageEntity[]> {
    return this.dentalImagesRepository.find({
      where: { category_id },
    });
  }

  async findByUploadedBy(uploaded_by: string): Promise<DentalImageEntity[]> {
    return this.dentalImagesRepository.find({
      where: { uploaded_by },
    });
  }

  async findByPacsId(pacs_id: string): Promise<DentalImageEntity[]> {
    return this.dentalImagesRepository.find({
      where: { pacs_id },
    });
  }

  async findArchived(): Promise<DentalImageEntity[]> {
    return this.dentalImagesRepository.find({
      where: { is_archived: true },
    });
  }

  async update(
    image_id: string,
    updateDentalImageDto: UpdateDentalImageDto,
  ): Promise<DentalImageEntity> {
    const dentalImage = await this.findOne(image_id);
    await this.assertLinkedRecordMutable(dentalImage);
    this.assertContextUnchanged(dentalImage, updateDentalImageDto);
    Object.assign(dentalImage, updateDentalImageDto);
    return this.dentalImagesRepository.save(dentalImage);
  }

  async remove(image_id: string): Promise<void> {
    const dentalImage = await this.findOne(image_id);
    await this.assertLinkedRecordMutable(dentalImage);
    await this.dentalImagesRepository.remove(dentalImage);
  }

  async archive(image_id: string): Promise<DentalImageEntity> {
    const dentalImage = await this.findOne(image_id);
    await this.assertLinkedRecordMutable(dentalImage);
    dentalImage.is_archived = true;
    return this.dentalImagesRepository.save(dentalImage);
  }

  private async assertLinkedRecordMutable(
    dentalImage: DentalImageEntity,
  ): Promise<void> {
    if (!dentalImage.record_id) {
      return;
    }

    await this.findMutableRecord(dentalImage.record_id);
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
        'Finalized medical records cannot change dental images. Create an amendment instead.',
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
        'Dental image patient does not match medical record.',
      );
    }
  }

  private assertContextUnchanged(
    dentalImage: DentalImageEntity,
    updateDentalImageDto: UpdateDentalImageDto,
  ): void {
    const contextFields = [
      'patient_id',
      'record_id',
      'uploaded_by',
      'image_url',
    ] as const;

    for (const field of contextFields) {
      const nextValue = updateDentalImageDto[field];
      if (nextValue !== undefined && nextValue !== dentalImage[field]) {
        throw new BadRequestException(`${field} cannot be changed`);
      }
    }
  }
}
