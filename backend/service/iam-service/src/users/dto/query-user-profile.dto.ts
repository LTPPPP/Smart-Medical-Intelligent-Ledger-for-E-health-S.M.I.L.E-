import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterUserProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gender?: string;
}

export class SortUserProfileDto {
  @ApiProperty()
  @IsString()
  orderBy: string;

  @ApiProperty()
  @IsString()
  order: 'ASC' | 'DESC';
}

export class QueryUserProfileDto {
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

  @ApiProperty({ required: false, type: FilterUserProfileDto })
  @IsOptional()
  filters?: FilterUserProfileDto;

  @ApiProperty({ required: false, type: [SortUserProfileDto] })
  @IsOptional()
  sort?: SortUserProfileDto[];
}
