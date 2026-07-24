import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectDataSource('iamUserConnection')
    private readonly iamUserDataSource: DataSource,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check service health and DB connectivity' })
  @ApiOkResponse({
    schema: {
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'iam-service' },
        timestamp: { type: 'string', example: '2026-01-01T00:00:00.000Z' },
        database: {
          type: 'object',
          properties: {
            auth_service_db: { type: 'string', example: 'connected' },
            account_service_db: { type: 'string', example: 'connected' },
          },
        },
      },
    },
  })
  check() {
    return {
      status: 'ok',
      service: 'iam-service',
      timestamp: new Date().toISOString(),
      database: {
        auth_service_db: this.dataSource.isInitialized
          ? 'connected'
          : 'disconnected',
        account_service_db: this.iamUserDataSource.isInitialized
          ? 'connected'
          : 'disconnected',
      },
    };
  }
}
