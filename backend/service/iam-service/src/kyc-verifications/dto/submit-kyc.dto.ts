import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class SubmitKycDto {
  @ApiProperty({ enum: ['CITIZEN_ID'] })
  @IsIn(['CITIZEN_ID'])
  idType: string;

  @ApiProperty({ example: '079123456789' })
  @IsString()
  @Matches(/^\d{12}$/, {
    message: 'Enter the 12-digit number printed on your citizen ID.',
  })
  idNumber: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '1995-06-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: 'true', description: 'Must be true for KYC submission.' })
  @IsBooleanString()
  consentAccepted: string;

  @ApiProperty({
    example: 'true',
    description:
      'Allows S.M.I.L.E to securely store uploaded identity document images for manual KYC review.',
  })
  @IsBooleanString()
  documentStorageConsentAccepted: string;

  @ApiProperty({
    example: 'true',
    description: 'Allows OCR processing of identity document images to support manual KYC review.',
  })
  @IsBooleanString()
  ocrProcessingConsentAccepted: string;

  @ApiProperty({
    example: 'true',
    description: 'Acknowledges KYC data will not be used for marketing.',
  })
  @IsBooleanString()
  noMarketingConsentAccepted: string;

  @ApiPropertyOptional({ example: 'kyc-consent-v1' })
  @IsOptional()
  @IsString()
  consentVersion?: string;

  @ApiPropertyOptional({ example: 'kyc-retention-v1' })
  @IsOptional()
  @IsString()
  retentionPolicyVersion?: string;

  @ApiPropertyOptional({ example: 'Submitted from profile page' })
  @IsOptional()
  @IsString()
  notes?: string;
}
