import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  IsObject,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ClinicStatus } from '../../utils/enums/clinic-status.enum';

export class CreateClinicDto {
  @ApiProperty({ example: 'S.M.I.L.E Central Clinic' })
  @IsString()
  @MaxLength(255)
  clinic_name: string;

  @ApiProperty({ example: 'SMILE001' })
  @IsString()
  @MaxLength(50)
  clinic_code: string;

  @ApiProperty({ example: '123 Nguyen Van Linh, District 7' })
  @IsString()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string | null;

  @ApiProperty({ required: false, example: 'Ho Chi Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo_url?: string | null;

  @ApiProperty({
    required: false,
    example: { monday: '08:00-17:00', tuesday: '08:00-17:00' },
  })
  @IsOptional()
  @IsObject()
  operating_hours?: Record<string, string> | null;

  @ApiProperty({
    required: false,
    enum: ClinicStatus,
    default: ClinicStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ClinicStatus)
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  license_number?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  license_expiry?: string | null;
}
