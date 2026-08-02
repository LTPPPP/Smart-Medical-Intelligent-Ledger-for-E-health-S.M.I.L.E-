import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

// Trusted Param Subset
export class AvatarSignatureDto {
  @ApiProperty({ required: false, example: 1712345678 })
  @IsOptional()
  @IsInt()
  timestamp?: number;

  // Crop Coordinates
  @ApiProperty({ required: false, example: '68,156,429,429' })
  @IsOptional()
  @IsString()
  custom_coordinates?: string;

  // Upload Source Tag
  @ApiProperty({ required: false, example: 'uw' })
  @IsOptional()
  @IsString()
  source?: string;
}
