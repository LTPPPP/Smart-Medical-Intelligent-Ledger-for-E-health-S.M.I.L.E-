import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsInt,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'CLEAN01' })
  @IsString()
  @MaxLength(50)
  service_code: string;

  @ApiProperty({ example: 'Teeth Cleaning' })
  @IsString()
  @MaxLength(255)
  service_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  category_id?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  specialty_id?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ required: false, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @ApiProperty({ required: false, example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  base_price?: number | null;

  @ApiProperty({ required: false, default: 'VND' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  requires_appointment?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preparation_instructions?: string | null;
}
