import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  role_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string | null;
}
