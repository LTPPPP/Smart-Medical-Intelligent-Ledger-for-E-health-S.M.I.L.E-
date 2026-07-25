import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

import { GenderEnum, GENDER_VALUES } from '@auth/accounts/domain/account';
import { genderCodeTransformer } from '@auth/utils/transformers/gender-code.transformer';

export { GenderEnum };

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'admin@smile.com', type: String })
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'admin' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    enum: GENDER_VALUES,
    example: GenderEnum.MALE,
    description: 'ISO 5218 code: 0 unknown, 1 male, 2 female.',
  })
  @IsOptional()
  @Transform(genderCodeTransformer)
  @IsInt()
  @IsIn(GENDER_VALUES)
  gender?: GenderEnum;
}
