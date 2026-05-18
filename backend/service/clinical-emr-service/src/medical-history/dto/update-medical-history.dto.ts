import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMedicalHistoryDto } from './create-medical-history.dto';

/** patient_id is immutable after creation */
export class UpdateMedicalHistoryDto extends PartialType(
  OmitType(CreateMedicalHistoryDto, ['patient_id'] as const),
) {}
