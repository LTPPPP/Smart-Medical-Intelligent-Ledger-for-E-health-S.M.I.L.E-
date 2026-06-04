import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsDateString, MaxLength } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiProperty({ required: false, example: 'Nguyen Van B' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @ApiProperty({ required: false, example: 'user@smile.com' })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiProperty({ required: false, example: '+84901234567' })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiProperty({ required: false, example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string | null;

  @ApiProperty({ required: false, example: 'female' })
  @IsOptional()
  @IsString()
  gender?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar_url?: string | null;
}
