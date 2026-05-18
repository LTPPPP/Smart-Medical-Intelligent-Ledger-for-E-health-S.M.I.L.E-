import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

/** patient_code and user_id are immutable after creation */
export class UpdatePatientDto extends PartialType(
  OmitType(CreatePatientDto, ['user_id'] as const),
) {}
