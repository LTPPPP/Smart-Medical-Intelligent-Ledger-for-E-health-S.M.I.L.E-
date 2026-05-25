import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdatePermissionDto {
  @ApiProperty({
    required: false,
    example: 'medical_record.write',
    description: 'Unique permission name in format resource.action',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  permission_name?: string;

  @ApiProperty({
    required: false,
    example: 'medical_record',
    description: 'Resource this permission targets',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  resource?: string;

  @ApiProperty({
    required: false,
    example: 'write',
    description: 'Action allowed on the resource',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  action?: string;

  @ApiProperty({
    required: false,
    example: 'Updated permission description',
    description: 'Human-readable description of what this permission grants',
  })
  @IsOptional()
  @IsString()
  description?: string | null;
}
