import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryServiceDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  service_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  specialty_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
