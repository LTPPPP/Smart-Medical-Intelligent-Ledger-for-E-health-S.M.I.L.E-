import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { GenderEnum } from '../enums/gender.enum';
import { BloodTypeEnum } from '../enums/blood-type.enum';

@Exclude()
export class PatientResponseDto {
  @Expose()
  @ApiProperty()
  patient_id: string;

  @Expose()
  @ApiProperty()
  patient_code: string;

  @Expose()
  @ApiProperty()
  full_name: string;

  @Expose()
  @ApiPropertyOptional()
  date_of_birth: Date | null;

  @Expose()
  @ApiPropertyOptional({ enum: GenderEnum })
  gender: string | null;

  @Expose()
  @ApiPropertyOptional()
  phone: string | null;

  @Expose()
  @ApiPropertyOptional()
  email: string | null;

  @Expose()
  @ApiPropertyOptional()
  address: string | null;

  @Expose()
  @ApiPropertyOptional()
  ward: string | null;

  @Expose()
  @ApiPropertyOptional()
  district: string | null;

  @Expose()
  @ApiPropertyOptional()
  city: string | null;

  @Expose()
  @ApiPropertyOptional()
  emergency_contact: string | null;

  @Expose()
  @ApiPropertyOptional()
  emergency_phone: string | null;

  @Expose()
  @ApiPropertyOptional({ enum: BloodTypeEnum })
  blood_type: string | null;

  @Expose()
  @ApiPropertyOptional({ type: [String] })
  allergies: string[] | null;

  @Expose()
  @ApiPropertyOptional({ type: [String] })
  chronic_diseases: string[] | null;

  @Expose()
  @ApiPropertyOptional()
  insurance_number: string | null;

  @Expose()
  @ApiPropertyOptional()
  insurance_provider: string | null;

  @Expose()
  @ApiProperty()
  created_at: Date;

  @Expose()
  @ApiProperty()
  updated_at: Date;
}
