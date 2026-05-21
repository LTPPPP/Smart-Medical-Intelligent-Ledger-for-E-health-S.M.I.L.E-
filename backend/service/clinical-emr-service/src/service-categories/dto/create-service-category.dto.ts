import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsInt,
  IsUUID,
} from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiProperty({ example: 'Preventive Dentistry' })
  @IsString()
  @MaxLength(255)
  category_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    required: false,
    description: 'Parent category UUID for tree hierarchy',
  })
  @IsOptional()
  @IsUUID()
  parent_category_id?: string | null;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  display_order?: number | null;
}
