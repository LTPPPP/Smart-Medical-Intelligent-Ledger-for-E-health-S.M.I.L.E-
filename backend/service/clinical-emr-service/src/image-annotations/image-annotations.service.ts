import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageAnnotationEntity } from './entities/image-annotation.entity';
import { CreateImageAnnotationDto } from './dto/create-image-annotation.dto';
import { UpdateImageAnnotationDto } from './dto/update-image-annotation.dto';

@Injectable()
export class ImageAnnotationsService {
  constructor(
    @InjectRepository(ImageAnnotationEntity)
    private imageAnnotationsRepository: Repository<ImageAnnotationEntity>,
  ) {}

  async create(
    createImageAnnotationDto: CreateImageAnnotationDto,
  ): Promise<ImageAnnotationEntity> {
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
    Object.assign(imageAnnotation, updateImageAnnotationDto);
    return this.imageAnnotationsRepository.save(imageAnnotation);
  }

  async remove(annotation_id: string): Promise<void> {
    const imageAnnotation = await this.findOne(annotation_id);
    await this.imageAnnotationsRepository.remove(imageAnnotation);
  }
}
