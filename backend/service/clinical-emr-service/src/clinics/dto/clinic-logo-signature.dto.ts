import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

// Trusted Param Subset
export class ClinicLogoSignatureDto {
  @ApiProperty({ required: false, example: 1712345678 })
  @IsOptional()
  @IsInt()
  timestamp?: number;

  // A New Clinic Has No Id Yet — Client Sends A Temp Id, Reused As The
  // Cloudinary public_id So Re-Uploads During The Same Session Overwrite.
  @ApiProperty({ example: 'new-a1b2c3' })
  @IsString()
  resource_id: string;

  // Upload Source Tag
  @ApiProperty({ required: false, example: 'uw' })
  @IsOptional()
  @IsString()
  source?: string;

  // Crop Coordinates
  @ApiProperty({ required: false, example: '0,285,1991,1991' })
  @IsOptional()
  @IsString()
  custom_coordinates?: string;
}
