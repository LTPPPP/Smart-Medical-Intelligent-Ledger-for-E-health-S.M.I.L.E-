import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageAnnotationEntity } from './entities/image-annotation.entity';
import { CreateImageAnnotationDto } from './dto/create-image-annotation.dto';
import { UpdateImageAnnotationDto } from './dto/update-image-annotation.dto';
import { DentalImageEntity } from '../dental-images/entities/dental-image.entity';
import { MedicalRecordEntity } from '../medical-records/entities/medical-record.entity';

@Injectable()
export class ImageAnnotationsService {
  private readonly lockedRecordStatuses = ['finalized', 'completed', 'signed'];

  constructor(
    @InjectRepository(ImageAnnotationEntity)
    private imageAnnotationsRepository: Repository<ImageAnnotationEntity>,
    @InjectRepository(DentalImageEntity)
    private dentalImagesRepository: Repository<DentalImageEntity>,
    @InjectRepository(MedicalRecordEntity)
    private medicalRecordsRepository: Repository<MedicalRecordEntity>,
  ) {}

  async create(
    createImageAnnotationDto: CreateImageAnnotationDto,
  ): Promise<ImageAnnotationEntity> {
    await this.findMutableImage(createImageAnnotationDto.image_id);

    const imageAnnotation = this.imageAnnotationsRepository.create(
      createImageAnnotationDto,
    );
    return this.imageAnnotationsRepository.save(imageAnnotation);
  }

  async findAll(): Promise<ImageAnnotationEntity[]> {
    return this.imageAnnotationsRepository.find();
  }

  async findOne(annotation_id: string): Promise<ImageAnnotationEntity> {
    const imageAnnotation = await this.imageAnnotationsRepository.findOne({
      where: { annotation_id },
    });
    if (!imageAnnotation) {
      throw new NotFoundException(
        `Image annotation with ID ${annotation_id} not found`,
      );
    }
    return imageAnnotation;
  }

  async findByImageId(image_id: string): Promise<ImageAnnotationEntity[]> {
    return this.imageAnnotationsRepository.find({
      where: { image_id },
    });
  }

  async findByAnnotatedBy(
    annotated_by: string,
  ): Promise<ImageAnnotationEntity[]> {
    return this.imageAnnotationsRepository.find({
      where: { annotated_by },
    });
  }

  async findByType(annotation_type: string): Promise<ImageAnnotationEntity[]> {
    return this.imageAnnotationsRepository.find({
      where: { annotation_type },
    });
  }

  async update(
    annotation_id: string,
    updateImageAnnotationDto: UpdateImageAnnotationDto,
  ): Promise<ImageAnnotationEntity> {
    const imageAnnotation = await this.findOne(annotation_id);
    await this.findMutableImage(imageAnnotation.image_id);
    this.assertContextUnchanged(imageAnnotation, updateImageAnnotationDto);
    Object.assign(imageAnnotation, updateImageAnnotationDto);
    return this.imageAnnotationsRepository.save(imageAnnotation);
  }

  async remove(annotation_id: string): Promise<void> {
    const imageAnnotation = await this.findOne(annotation_id);
    await this.findMutableImage(imageAnnotation.image_id);
    await this.imageAnnotationsRepository.remove(imageAnnotation);
  }

  private async findMutableImage(
    image_id: string,
  ): Promise<DentalImageEntity> {
    const image = await this.dentalImagesRepository.findOne({
      where: { image_id },
    });
    if (!image) {
      throw new NotFoundException(`Dental image with ID ${image_id} not found`);
    }
    if (image.is_archived) {
      throw new ConflictException(
        'Archived dental images cannot change annotations.',
      );
    }
    if (image.record_id) {
      await this.assertLinkedRecordMutable(image.record_id);
    }
    return image;
  }

  private async assertLinkedRecordMutable(record_id: string): Promise<void> {
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
        'Finalized medical records cannot change image annotations. Create an amendment instead.',
      );
    }
  }

  private assertContextUnchanged(
    imageAnnotation: ImageAnnotationEntity,
    updateImageAnnotationDto: UpdateImageAnnotationDto,
  ): void {
    const contextFields = ['image_id', 'annotated_by'] as const;

    for (const field of contextFields) {
      const nextValue = updateImageAnnotationDto[field];
      if (nextValue !== undefined && nextValue !== imageAnnotation[field]) {
        throw new BadRequestException(`${field} cannot be changed`);
      }
    }
  }
}
