import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateLabTestResultDto {
  @IsString()
  order_id: string;

  @IsString()
  test_name: string;

  @IsString()
  @IsOptional()
  result_value?: string;

  @IsString()
  @IsOptional()
  result_unit?: string;

  @IsString()
  @IsOptional()
  reference_range?: string;

  @IsBoolean()
  @IsOptional()
  is_abnormal?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
