import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode, Query, UseGuards, Request } from '@nestjs/common';
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
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService, RolesPageResult } from './roles.service';
import { RoleEntity } from './entities/role.entity';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.ADMIN)
@Controller({
  path: 'roles',
  version: '1',
})
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiCreatedResponse({ type: RoleEntity })
  async create(@Request() request, @Body() createRoleDto: CreateRoleDto): Promise<RoleEntity> {
    const role = await this.rolesService.create(createRoleDto);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ROLE_CREATE',
      resource: 'role',
      resource_id: role?.role_id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { role_name: createRoleDto.role_name },
    });
    return role;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all roles with pagination and search' })
  findAll(@Query() query: QueryRoleDto): Promise<RolesPageResult> {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: RoleEntity })
  findOne(@Param('id') id: string): Promise<RoleEntity | null> {
    return this.rolesService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: RoleEntity })
  async update(@Request() request, @Param('id') id: string, @Body() updateData: UpdateRoleDto): Promise<RoleEntity | null> {
    const role = await this.rolesService.update(id, updateData);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ROLE_UPDATE',
      resource: 'role',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { changes: updateData },
    });
    return role;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', type: String })
  @ApiNoContentResponse()
  async remove(@Request() request, @Param('id') id: string): Promise<void> {
    await this.rolesService.remove(id);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'ROLE_DELETE',
      resource: 'role',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
    });
  }
}
