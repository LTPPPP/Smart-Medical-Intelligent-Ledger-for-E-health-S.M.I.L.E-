import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DiagnosticOrdersService } from './diagnostic-orders.service';
import { CreateDiagnosticOrderDto } from './dto/create-diagnostic-order.dto';
import { UpdateDiagnosticOrderDto } from './dto/update-diagnostic-order.dto';

@ApiTags('Examinations')
@Controller({
  path: 'diagnostic-orders',
  version: '1',
})
export class DiagnosticOrdersController {
  constructor(
    private readonly diagnosticOrdersService: DiagnosticOrdersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-075/076/077/078: Create diagnostic order (X-ray/CBCT/lab/clinical)',
  })
  create(@Body() dto: CreateDiagnosticOrderDto) {
    return this.diagnosticOrdersService.create(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get diagnostic order detail' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.diagnosticOrdersService.findById(id);
    if (!order) {
      throw new NotFoundException(`Diagnostic order with ID ${id} not found`);
    }
    return order;
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get diagnostic order by code' })
  @ApiParam({ name: 'code', description: 'Order code' })
  async findByCode(@Param('code') code: string) {
    const order = await this.diagnosticOrdersService.findByCode(code);
    if (!order) {
      throw new NotFoundException(
        `Diagnostic order with code ${code} not found`,
      );
    }
    return order;
  }

  @Get('appointment/:appointmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get diagnostic orders by appointment' })
  @ApiParam({ name: 'appointmentId', description: 'Appointment UUID' })
  findByAppointment(@Param('appointmentId', ParseUUIDPipe) appointmentId: string) {
    return this.diagnosticOrdersService.findByAppointment(appointmentId);
  }

  @Get('patient/:patientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get diagnostic orders by patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.diagnosticOrdersService.findByPatient(patientId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update diagnostic order (add results, change status)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDiagnosticOrderDto) {
    return this.diagnosticOrdersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete diagnostic order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.diagnosticOrdersService.remove(id);
  }
}
