import { Controller, Get, Post, Body, Param, Query, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditLogEntity } from './entities/audit-log.entity';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';

@ApiTags('AuditLogs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.ADMIN)
@Controller({
  path: 'audit-logs',
  version: '1',
})
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an audit log entry' })
  @ApiCreatedResponse({ type: AuditLogEntity })
  create(@Body() dto: CreateAuditLogDto): Promise<AuditLogEntity> {
    return this.auditLogsService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit logs (paginated)' })
  @ApiOkResponse({
    schema: {
      properties: {
        data: {
          type: 'array',
          items: {
            allOf: [
              { $ref: '#/components/schemas/AuditLogEntity' },
              { properties: { full_name: { type: 'string', nullable: true } } },
            ],
          },
        },
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
  async findAll(@Query() query: QueryAuditLogDto) {
    const result = await this.auditLogsService.findAll(query);
    return {
      data: result.data,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        total: result.total,
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: '#/components/schemas/AuditLogEntity' },
        { properties: { full_name: { type: 'string', nullable: true } } },
      ],
    },
  })
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findById(id);
  }
}
