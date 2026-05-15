import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateDoctorSpecialtyDto {
  @ApiProperty({ description: 'Doctor UUID from user-service' })
  @IsUUID()
  doctor_id: string;

  @ApiProperty({ description: 'Specialty UUID' })
  @IsUUID()
  specialty_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  certification_number?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  certified_date?: string | null;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
