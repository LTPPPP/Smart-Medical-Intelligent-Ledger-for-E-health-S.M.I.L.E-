import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @IsNotEmpty()
  @IsUUID()
  role_id: string;
}
