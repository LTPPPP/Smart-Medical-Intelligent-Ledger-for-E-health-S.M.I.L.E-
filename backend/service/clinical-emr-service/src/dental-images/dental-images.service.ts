import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DentalImageEntity } from './entities/dental-image.entity';
import { CreateDentalImageDto } from './dto/create-dental-image.dto';
import { UpdateDentalImageDto } from './dto/update-dental-image.dto';

@Injectable()
export class DentalImagesService {
  constructor(
    @InjectRepository(DentalImageEntity)
    private dentalImagesRepository: Repository<DentalImageEntity>,
  ) {}

  async create(
    createDentalImageDto: CreateDentalImageDto,
  ): Promise<DentalImageEntity> {
    const dentalImage = this.dentalImagesRepository.create(createDentalImageDto);
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
    Object.assign(dentalImage, updateDentalImageDto);
    return this.dentalImagesRepository.save(dentalImage);
  }

  async remove(image_id: string): Promise<void> {
    const dentalImage = await this.findOne(image_id);
    await this.dentalImagesRepository.remove(dentalImage);
  }

  async archive(image_id: string): Promise<DentalImageEntity> {
    const dentalImage = await this.findOne(image_id);
    dentalImage.is_archived = true;
    return this.dentalImagesRepository.save(dentalImage);
  }
}
