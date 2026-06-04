import { PartialType } from '@nestjs/swagger';
import { CreateClinicalOrderDto } from './create-clinical-order.dto';

export class UpdateClinicalOrderDto extends PartialType(
  CreateClinicalOrderDto,
) {}
