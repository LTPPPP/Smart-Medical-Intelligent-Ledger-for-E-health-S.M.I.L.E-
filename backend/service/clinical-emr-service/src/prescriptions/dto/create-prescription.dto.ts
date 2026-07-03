import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePrescriptionDto {
  @IsUUID()
  @IsOptional()
  session_id?: string;

  @IsUUID()
  @IsOptional()
  record_id?: string;

  @IsUUID()
  patient_id: string;

  @IsUUID()
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
