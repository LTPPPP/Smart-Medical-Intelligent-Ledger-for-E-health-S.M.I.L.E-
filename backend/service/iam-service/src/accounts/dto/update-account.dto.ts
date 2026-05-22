import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { GenderEnum } from '../domain/account';

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

  @ApiProperty({ enum: GenderEnum, example: GenderEnum.MALE, required: false, nullable: true })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum | null;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
