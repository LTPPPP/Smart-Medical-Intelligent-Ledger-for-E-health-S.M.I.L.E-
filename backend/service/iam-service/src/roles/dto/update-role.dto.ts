import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ required: false, example: 'SENIOR_DOCTOR' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  role_name?: string;

  @ApiProperty({ required: false, example: 'Updated role description' })
  @IsOptional()
  @IsString()
  description?: string | null;
}
