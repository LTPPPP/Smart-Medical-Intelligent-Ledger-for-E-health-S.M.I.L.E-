import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the permission to assign to the role',
  })
  @IsNotEmpty()
  @IsUUID()
  permission_id: string;
}
