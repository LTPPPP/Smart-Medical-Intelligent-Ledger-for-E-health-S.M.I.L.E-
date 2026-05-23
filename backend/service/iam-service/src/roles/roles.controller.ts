import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';
import { RoleEntity } from './entities/role.entity';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller({
  path: 'roles',
  version: '1',
})
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiCreatedResponse({ type: RoleEntity })
  create(@Body() createRoleDto: CreateRoleDto): Promise<RoleEntity> {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all roles' })
  @ApiOkResponse({ type: [RoleEntity] })
  findAll(): Promise<RoleEntity[]> {
    return this.rolesService.findAll();
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
  update(@Param('id') id: string, @Body() updateData: UpdateRoleDto): Promise<RoleEntity | null> {
    return this.rolesService.update(id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', type: String })
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(id);
  }
}
