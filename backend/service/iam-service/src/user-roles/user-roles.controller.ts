import { Controller, Get, Post, Body, Param, Delete, HttpStatus, HttpCode, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRolesService } from './user-roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UserRoleEntity } from './entities/user-role.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@ApiTags('UserRoles')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.ADMIN)
@Controller({
  path: 'user-roles',
  version: '1',
})
export class UserRolesController {
  constructor(
    private readonly userRolesService: UserRolesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

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
  async assignRole(@Request() request, @Param('userId') userId: string, @Body() dto: AssignRoleDto): Promise<UserRoleEntity> {
    const result = await this.userRolesService.assignRole(userId, dto.role_id);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'USER_ROLE_ASSIGN',
      resource: 'user',
      resource_id: userId,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { role_id: dto.role_id },
    });
    return result;
  }

  @Delete('user/:userId/role/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a role from a user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiParam({ name: 'roleId', type: String })
  @ApiNoContentResponse()
  async revokeRole(@Request() request, @Param('userId') userId: string, @Param('roleId') roleId: string): Promise<void> {
    await this.userRolesService.revokeRole(userId, roleId);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'USER_ROLE_REVOKE',
      resource: 'user',
      resource_id: userId,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { role_id: roleId },
    });
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
