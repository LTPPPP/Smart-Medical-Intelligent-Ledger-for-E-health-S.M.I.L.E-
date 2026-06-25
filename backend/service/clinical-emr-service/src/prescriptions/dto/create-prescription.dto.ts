import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePrescriptionDto {
  @IsString()
  @IsOptional()
  record_id?: string;

  @IsString()
  patient_id: string;

  @IsString()
  doctor_id: string;

  @IsDateString()
  @IsOptional()
  prescription_date?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  digital_signature_id?: string;
}
