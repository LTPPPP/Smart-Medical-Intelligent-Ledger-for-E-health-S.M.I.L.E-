import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ApproveKycDto {
  @ApiPropertyOptional({ example: 'OCR and documents look consistent.' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class RejectKycDto {
  @ApiProperty({ example: 'ID image is blurry.' })
  @IsString()
  @MinLength(3)
  rejectionReason: string;

  @ApiPropertyOptional({ example: 'Ask user to upload a clearer front image.' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
