import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePrescriptionItemDto {
  @IsString()
  @IsNotEmpty()
  prescription_id: string;

  @IsString()
  @IsNotEmpty()
  medication_name: string;

  @IsString()
  @IsOptional()
  medication_code?: string;

  @IsString()
  @IsNotEmpty()
  dosage: string;

  @IsString()
  @IsNotEmpty()
  route: string;

  @IsString()
  @IsNotEmpty()
  frequency: string;

  @IsInt()
  @Min(1)
  duration_days: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  instructions: string;
}
