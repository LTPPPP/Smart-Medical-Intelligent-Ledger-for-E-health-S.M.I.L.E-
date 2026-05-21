import { IsOptional, IsString } from 'class-validator';

export class CreateImageCategoryDto {
  @IsString()
  category_name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
