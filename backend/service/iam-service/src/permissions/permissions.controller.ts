import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.ADMIN)
@Controller({
  path: 'permissions',
  version: '1',
})
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiBody({
    type: CreatePermissionDto,
    examples: {
      medical_record_read: {
        summary: 'Create medical_record.read permission',
        value: {
          permission_name: 'medical_record.read',
          resource: 'medical_record',
          action: 'read',
          description: 'View patient medical records',
        },
      },
      appointment_create: {
        summary: 'Create appointment.create permission',
        value: {
          permission_name: 'appointment.create',
          resource: 'appointment',
          action: 'create',
          description: 'Create new appointments',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: PermissionEntity })
  async create(@Request() request, @Body() dto: CreatePermissionDto): Promise<PermissionEntity> {
    const permission = await this.permissionsService.create(dto);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'PERMISSION_CREATE',
      resource: 'permission',
      resource_id: permission?.permission_id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { permission_name: dto.permission_name },
    });
    return permission;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiOkResponse({ type: [PermissionEntity] })
  findAll(): Promise<PermissionEntity[]> {
    return this.permissionsService.findAll();
  }

  @Get('role/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all permissions assigned to a role' })
  @ApiParam({ name: 'roleId', type: String, example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  @ApiOkResponse({ type: [PermissionEntity] })
  getPermissionsByRole(@Param('roleId') roleId: string): Promise<PermissionEntity[]> {
    return this.permissionsService.getPermissionsByRole(roleId);
  }

  @Post('role/:roleId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiParam({ name: 'roleId', type: String, example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  @ApiBody({
    type: AssignPermissionDto,
    examples: {
      assign_medical_record_read: {
        summary: 'Assign medical_record.read to doctor role',
        value: {
          permission_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: RolePermissionEntity })
  async assignToRole(@Request() request, @Param('roleId') roleId: string, @Body() dto: AssignPermissionDto): Promise<RolePermissionEntity> {
    const result = await this.permissionsService.assignPermissionToRole(roleId, dto.permission_id);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ROLE_PERMISSION_ASSIGN',
      resource: 'role',
      resource_id: roleId,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { permission_id: dto.permission_id },
    });
    return result;
  }

  @Delete('role/:roleId/:permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a permission from a role' })
  @ApiParam({ name: 'roleId', type: String, example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  @ApiParam({ name: 'permissionId', type: String, example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiNoContentResponse()
  async revokeFromRole(@Request() request, @Param('roleId') roleId: string, @Param('permissionId') permissionId: string): Promise<void> {
    await this.permissionsService.revokePermissionFromRole(roleId, permissionId);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ROLE_PERMISSION_REVOKE',
      resource: 'role',
      resource_id: roleId,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { permission_id: permissionId },
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', type: String, example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ type: PermissionEntity })
  findOne(@Param('id') id: string): Promise<PermissionEntity | null> {
    return this.permissionsService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', type: String, example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({
    type: UpdatePermissionDto,
    examples: {
      update_name_and_description: {
        summary: 'Update permission name and description',
        value: {
          permission_name: 'patient.record.write',
          description: 'Updated permission description',
        },
      },
    },
  })
  @ApiOkResponse({ type: PermissionEntity })
  async update(@Request() request, @Param('id') id: string, @Body() updateData: UpdatePermissionDto): Promise<PermissionEntity | null> {
    const permission = await this.permissionsService.update(id, updateData);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'PERMISSION_UPDATE',
      resource: 'permission',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { changes: updateData },
    });
    return permission;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam({ name: 'id', type: String, example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiNoContentResponse()
  async remove(@Request() request, @Param('id') id: string): Promise<void> {
    await this.permissionsService.remove(id);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'PERMISSION_DELETE',
      resource: 'permission',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
    });
  }
}

