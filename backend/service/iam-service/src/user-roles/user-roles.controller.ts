import { Controller, Get, Post, Body, Param, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UserRolesService } from './user-roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UserRoleEntity } from './entities/user-role.entity';
import { RoleEntity } from '../roles/entities/role.entity';

@ApiTags('UserRoles')
@ApiBearerAuth()
@Controller({
  path: 'user-roles',
  version: '1',
})
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all roles assigned to a user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({ type: [RoleEntity] })
  getRolesByUser(@Param('userId') userId: string): Promise<RoleEntity[]> {
    return this.userRolesService.getRolesByUser(userId);
  }

  @Post('user/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiCreatedResponse({ type: UserRoleEntity })
  assignRole(@Param('userId') userId: string, @Body() dto: AssignRoleDto): Promise<UserRoleEntity> {
    return this.userRolesService.assignRole(userId, dto.role_id);
  }

  @Delete('user/:userId/role/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a role from a user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiParam({ name: 'roleId', type: String })
  @ApiNoContentResponse()
  revokeRole(@Param('userId') userId: string, @Param('roleId') roleId: string): Promise<void> {
    return this.userRolesService.revokeRole(userId, roleId);
  }

  @Get('role/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all user assignments for a role' })
  @ApiParam({ name: 'roleId', type: String })
  @ApiOkResponse({ type: [UserRoleEntity] })
  getUsersByRole(@Param('roleId') roleId: string): Promise<UserRoleEntity[]> {
    return this.userRolesService.getUsersByRole(roleId);
  }
}
