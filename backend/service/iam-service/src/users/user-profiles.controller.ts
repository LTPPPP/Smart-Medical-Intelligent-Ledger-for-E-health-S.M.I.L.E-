import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode, NotFoundException, UseGuards, Request } from '@nestjs/common';
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
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { QueryUserProfileDto } from './dto/query-user-profile.dto';
import { BanUserProfileDto } from './dto/ban-user-profile.dto';
import { UserProfilesService } from './user-profiles.service';
import { UserProfileEntity } from './entities/user-profile.entity';
import { PublicUserProfileDto } from './dto/public-user-profile.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

// Unguarded Get Endpoint
@ApiTags('UserProfiles')
@ApiBearerAuth()
@Controller({
  path: 'user-profiles',
  version: '1',
})
export class UserProfilesController {
  constructor(
    private readonly userProfilesService: UserProfilesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user profile' })
  @ApiCreatedResponse({ type: UserProfileEntity })
  create(@Body() createUserProfileDto: CreateUserProfileDto): Promise<UserProfileEntity> {
    return this.userProfilesService.create(createUserProfileDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all user profiles (paginated)' })
  @ApiOkResponse({
    schema: {
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/UserProfileEntity' } },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(@Query() query: QueryUserProfileDto) {
    const result = await this.userProfilesService.findAll(query);
    return {
      data: result.data,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total: result.total,
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get the public display profile for a user (unauthenticated)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: PublicUserProfileDto })
  async findOne(@Param('id') id: string): Promise<PublicUserProfileDto> {
    const profile = await this.userProfilesService.findById(id);
    if (!profile) {
      throw new NotFoundException(`User profile with ID ${id} not found`);
    }
    return PublicUserProfileDto.fromEntity(profile);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: UserProfileEntity })
  update(@Param('id') id: string, @Body() updateData: UpdateUserProfileDto): Promise<UserProfileEntity | null> {
    return this.userProfilesService.update(id, updateData as unknown as Partial<UserProfileEntity>);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user profile' })
  @ApiParam({ name: 'id', type: String })
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.userProfilesService.remove(id);
  }

  @Post(':id/ban')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban a user' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: UserProfileEntity })
  async ban(
    @Request() request,
    @Param('id') id: string,
    @Body() dto: BanUserProfileDto,
  ): Promise<UserProfileEntity> {
    const result = await this.userProfilesService.ban(id, dto.reason);
    if (!result) throw new NotFoundException(`User ${id} not found`);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'USER_BAN',
      resource: 'user',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
      details: { reason: dto.reason },
    });
    return result;
  }

  @Post(':id/unban')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unban a user' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: UserProfileEntity })
  async unban(@Request() request, @Param('id') id: string): Promise<UserProfileEntity> {
    const result = await this.userProfilesService.unban(id);
    if (!result) throw new NotFoundException(`User ${id} not found`);
    void this.auditLogsService.create({
      user_id: request.user?.accountId,
      action: 'USER_UNBAN',
      resource: 'user',
      resource_id: id,
      ip_address: request.ip ?? request.headers['x-forwarded-for'],
      user_agent: request.headers['user-agent'],
    });
    return result;
  }
}
