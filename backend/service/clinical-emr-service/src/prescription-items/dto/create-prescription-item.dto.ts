import {
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePrescriptionItemDto {
  @IsString()
  prescription_id: string;

  @IsString()
  medication_name: string;

  @IsString()
  @IsOptional()
  medication_code?: string;

  @IsString()
  dosage: string;

  @IsString()
  @IsOptional()
  route?: string;

  @IsString()
  frequency: string;

  @IsInt()
  @IsOptional()
  duration_days?: number;

  @IsInt()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  instructions?: string;
}
