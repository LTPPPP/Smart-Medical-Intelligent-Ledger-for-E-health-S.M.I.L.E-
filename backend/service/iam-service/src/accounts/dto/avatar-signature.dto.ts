import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

// Trusted subset of the widget's paramsToSign.
export class AvatarSignatureDto {
  @ApiProperty({ required: false, example: 1712345678 })
  @IsOptional()
  @IsInt()
  timestamp?: number;

  // Set when the user cropped.
  @ApiProperty({ required: false, example: '68,156,429,429' })
  @IsOptional()
  @IsString()
  custom_coordinates?: string;

  // Upload source tag.
  @ApiProperty({ required: false, example: 'uw' })
  @IsOptional()
  @IsString()
  source?: string;
}
