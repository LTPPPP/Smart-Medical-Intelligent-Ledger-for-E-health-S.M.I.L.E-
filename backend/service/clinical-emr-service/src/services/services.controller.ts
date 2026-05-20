import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

@ApiTags('Services')
@Controller({ version: '1' })
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ── Service CRUD ──

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a medical service' })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get('services')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List medical services' })
  async findAll(@Query() query: QueryServiceDto) {
    const result = await this.servicesService.findAll(query);
    return {
      data: result.data,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total: result.total,
      },
    };
  }

  @Get('services/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get service detail' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @Patch('services/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update service' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete('services/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete service' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  // ── Clinic-Service pricing ──

  @Post('clinics/:clinicId/services/:serviceId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign service to clinic with optional custom pricing' })
  @ApiBody({
    schema: {
      properties: {
        custom_price: { type: 'number', nullable: true },
      },
    },
  })
  assignToClinic(
    @Param('clinicId') clinicId: string,
    @Param('serviceId') serviceId: string,
    @Body() body: { custom_price?: number | null },
  ) {
    return this.servicesService.assignServiceToClinic(
      clinicId,
      serviceId,
      body.custom_price,
    );
  }

  @Get('clinics/:clinicId/services')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List services available at a clinic' })
  findClinicServices(@Param('clinicId') clinicId: string) {
    return this.servicesService.findClinicServices(clinicId);
  }

  @Patch('clinic-services/:clinicServiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update clinic-service pricing/availability' })
  updateClinicService(
    @Param('clinicServiceId') clinicServiceId: string,
    @Body() body: { custom_price?: number | null; is_available?: boolean },
  ) {
    return this.servicesService.updateClinicService(clinicServiceId, body);
  }

  @Delete('clinic-services/:clinicServiceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove service from clinic' })
  removeClinicService(@Param('clinicServiceId') clinicServiceId: string) {
    return this.servicesService.removeClinicService(clinicServiceId);
  }
}
