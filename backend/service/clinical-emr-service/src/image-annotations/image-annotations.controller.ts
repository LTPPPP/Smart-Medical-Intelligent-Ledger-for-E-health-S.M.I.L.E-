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
import { ImageAnnotationsService } from './image-annotations.service';
import { CreateImageAnnotationDto } from './dto/create-image-annotation.dto';
import { UpdateImageAnnotationDto } from './dto/update-image-annotation.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

// Staff/clinician-only — patient PHI; a PATIENT must not reach these endpoints.
@ApiTags('Dental Images')
@Controller('image-annotations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
export class ImageAnnotationsController {
  constructor(
    private readonly imageAnnotationsService: ImageAnnotationsService,
  ) {}

  @Post()
  create(@Body() createImageAnnotationDto: CreateImageAnnotationDto) {
    return this.imageAnnotationsService.create(createImageAnnotationDto);
  }

  @Get()
  findAll() {
    return this.imageAnnotationsService.findAll();
  }

  @Get(':annotation_id')
  findOne(@Param('annotation_id', ParseUUIDPipe) annotation_id: string) {
    return this.imageAnnotationsService.findOne(annotation_id);
  }

  @Get('image/:image_id')
  findByImageId(@Param('image_id', ParseUUIDPipe) image_id: string) {
    return this.imageAnnotationsService.findByImageId(image_id);
  }

  @Get('annotated-by/:annotated_by')
  findByAnnotatedBy(
    @Param('annotated_by', ParseUUIDPipe) annotated_by: string,
  ) {
    return this.imageAnnotationsService.findByAnnotatedBy(annotated_by);
  }

  @Get('type/:annotation_type')
  findByType(@Param('annotation_type') annotation_type: string) {
    return this.imageAnnotationsService.findByType(annotation_type);
  }

  @Patch(':annotation_id')
  update(
    @Param('annotation_id', ParseUUIDPipe) annotation_id: string,
    @Body() updateImageAnnotationDto: UpdateImageAnnotationDto,
  ) {
    return this.imageAnnotationsService.update(
      annotation_id,
      updateImageAnnotationDto,
    );
  }

  @Delete(':annotation_id')
  remove(@Param('annotation_id', ParseUUIDPipe) annotation_id: string) {
    return this.imageAnnotationsService.remove(annotation_id);
  }
}
