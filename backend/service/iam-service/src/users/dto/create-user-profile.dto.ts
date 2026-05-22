import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateUserProfileDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  full_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  date_of_birth?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  gender?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar_url?: string | null;
}
