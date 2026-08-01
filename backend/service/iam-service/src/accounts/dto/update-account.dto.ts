import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GenderEnum, GENDER_VALUES } from '../domain/account';
import { genderCodeTransformer } from '@auth/utils/transformers/gender-code.transformer';

export class UpdateAccountDto {
  @ApiProperty({ example: 'johndoe', required: false, nullable: true })
  @IsOptional()
  @IsString()
  username?: string | null;

  @ApiProperty({ example: 'john@example.com', required: false, nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiProperty({ example: '+1234567890', required: false, nullable: true })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiProperty({ example: 'Nguyen Van A', required: false, nullable: true })
  @IsOptional()
  @IsString()
  fullName?: string | null;

  @ApiProperty({
    enum: GENDER_VALUES,
    example: GenderEnum.MALE,
    required: false,
    nullable: true,
    description: 'ISO 5218 code: 0 unknown, 1 male, 2 female.',
  })
  @IsOptional()
  @Transform(genderCodeTransformer)
  @IsInt()
  @IsIn(GENDER_VALUES)
  gender?: GenderEnum | null;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  // Lives On User Profiles
  @ApiProperty({ example: '1990-01-01', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;
}
