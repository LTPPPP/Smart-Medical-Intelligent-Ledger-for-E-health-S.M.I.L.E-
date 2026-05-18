import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../utils/dto/pagination-query.dto';

export class SearchPatientQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, phone, email or patient_code' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;
}
