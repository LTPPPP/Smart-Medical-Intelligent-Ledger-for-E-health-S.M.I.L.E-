import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { QueryUserProfileDto } from './dto/query-user-profile.dto';
import { UserProfilesService } from './user-profiles.service';
import { UserProfileEntity } from './entities/user-profile.entity';

@ApiTags('UserProfiles')
@ApiBearerAuth()
@Controller({
  path: 'user-profiles',
  version: '1',
})
export class UserProfilesController {
  constructor(private readonly userProfilesService: UserProfilesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user profile' })
  @ApiCreatedResponse({ type: UserProfileEntity })
  create(@Body() createUserProfileDto: CreateUserProfileDto): Promise<UserProfileEntity> {
    return this.userProfilesService.create(createUserProfileDto);
  }

  @Get()
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
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: UserProfileEntity })
  findOne(@Param('id') id: string): Promise<UserProfileEntity | null> {
    return this.userProfilesService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: UserProfileEntity })
  update(@Param('id') id: string, @Body() updateData: UpdateUserProfileDto): Promise<UserProfileEntity | null> {
    return this.userProfilesService.update(id, updateData as unknown as Partial<UserProfileEntity>);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user profile' })
  @ApiParam({ name: 'id', type: String })
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.userProfilesService.remove(id);
  }
}
