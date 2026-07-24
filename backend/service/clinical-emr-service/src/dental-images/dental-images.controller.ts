import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DentalImagesService } from './dental-images.service';
import { CreateDentalImageDto } from './dto/create-dental-image.dto';
import { UpdateDentalImageDto } from './dto/update-dental-image.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

// Staff/clinician-only — patient PHI; a PATIENT must not reach these endpoints.
@ApiTags('Dental Images')
@Controller('dental-images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR)
export class DentalImagesController {
  constructor(private readonly dentalImagesService: DentalImagesService) {}

  // B3.4/B3.8: Nurse uploads and reviews clinical images (four-handed support,
  // X-Ray/CBCT assist). archive/remove stay Doctor/Admin-only (class default).
  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.NURSE)
  create(@Body() createDentalImageDto: CreateDentalImageDto) {
    return this.dentalImagesService.create(createDentalImageDto);
  }

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findAll() {
    return this.dentalImagesService.findAll();
  }

  @Get('archived')
  findArchived() {
    return this.dentalImagesService.findArchived();
  }

  @Get(':image_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findOne(@Param('image_id', ParseUUIDPipe) image_id: string) {
    return this.dentalImagesService.findOne(image_id);
  }

  @Get('patient/:patient_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.dentalImagesService.findByPatientId(patient_id);
  }

  @Get('record/:record_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findByRecordId(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.dentalImagesService.findByRecordId(record_id);
  }

  @Get('category/:category_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findByCategoryId(@Param('category_id', ParseUUIDPipe) category_id: string) {
    return this.dentalImagesService.findByCategoryId(category_id);
  }

  @Get('uploaded-by/:uploaded_by')
  findByUploadedBy(@Param('uploaded_by', ParseUUIDPipe) uploaded_by: string) {
    return this.dentalImagesService.findByUploadedBy(uploaded_by);
  }

  @Get('pacs/:pacs_id')
  findByPacsId(@Param('pacs_id') pacs_id: string) {
    return this.dentalImagesService.findByPacsId(pacs_id);
  }

  @Patch(':image_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.NURSE)
  update(
    @Param('image_id', ParseUUIDPipe) image_id: string,
    @Body() updateDentalImageDto: UpdateDentalImageDto,
  ) {
    return this.dentalImagesService.update(image_id, updateDentalImageDto);
  }

  @Patch(':image_id/archive')
  archive(@Param('image_id', ParseUUIDPipe) image_id: string) {
    return this.dentalImagesService.archive(image_id);
  }

  @Delete(':image_id')
  remove(@Param('image_id', ParseUUIDPipe) image_id: string) {
    return this.dentalImagesService.remove(image_id);
  }
}
