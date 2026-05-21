import { PartialType } from '@nestjs/swagger';
import { CreateDentalImageDto } from './create-dental-image.dto';

export class UpdateDentalImageDto extends PartialType(CreateDentalImageDto) {}
