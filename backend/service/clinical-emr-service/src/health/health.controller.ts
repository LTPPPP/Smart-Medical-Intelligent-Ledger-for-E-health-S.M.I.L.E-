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
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check service health' })
  @ApiOkResponse({
    schema: {
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'clinical-emr-service' },
        timestamp: { type: 'string', example: '2026-01-01T00:00:00.000Z' },
        database: { type: 'string', example: 'connected' },
      },
    },
  })
  async check() {
    return {
      status: 'ok',
      service: 'clinical-emr-service',
      timestamp: new Date().toISOString(),
      database: this.dataSource.isInitialized ? 'connected' : 'disconnected',
    };
  }
}
