import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsInt,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateSpecialtyDto {
  @ApiProperty({ example: 'General Dentistry' })
  @IsString()
  @MaxLength(255)
  specialty_name: string;

  @ApiProperty({ example: 'GEN_DEN' })
  @IsString()
  @MaxLength(50)
  specialty_code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon_url?: string | null;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  display_order?: number | null;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Clinic UUIDs this specialty is offered at',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  clinic_ids?: string[];
}
