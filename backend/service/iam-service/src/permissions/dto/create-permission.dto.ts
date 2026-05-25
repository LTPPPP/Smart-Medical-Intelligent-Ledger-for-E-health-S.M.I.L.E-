import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'medical_record.read',
    description: 'Unique permission name in format resource.action',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  permission_name: string;

  @ApiProperty({
    example: 'medical_record',
    description: 'Resource this permission targets (e.g. user, role, appointment, medical_record). Derived from permission_name if omitted.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  resource?: string;

  @ApiProperty({
    example: 'read',
    description: 'Action allowed on the resource (e.g. create, read, update, delete, cancel, manage). Derived from permission_name if omitted.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  action?: string;

  @ApiProperty({
    required: false,
    example: 'Allows reading patient medical records',
    description: 'Human-readable description of what this permission grants',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
