import { PartialType } from '@nestjs/swagger';
import { CreateImageAnnotationDto } from './create-image-annotation.dto';

export class UpdateImageAnnotationDto extends PartialType(CreateImageAnnotationDto) {}
