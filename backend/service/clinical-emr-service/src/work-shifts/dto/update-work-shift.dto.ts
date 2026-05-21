import { PartialType } from '@nestjs/swagger';
import { CreateWorkShiftDto } from './create-work-shift.dto';

export class UpdateWorkShiftDto extends PartialType(CreateWorkShiftDto) {}
