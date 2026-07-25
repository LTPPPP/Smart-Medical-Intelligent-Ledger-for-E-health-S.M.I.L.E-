import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseEnumPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClinicalOrdersService } from './clinical-orders.service';
import { CreateClinicalOrderDto } from './dto/create-clinical-order.dto';
import { UpdateClinicalOrderDto } from './dto/update-clinical-order.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { OrderStatus } from '../utils/enums/order-status.enum';

// Staff/clinician-only — patient PHI; a PATIENT must not reach these endpoints.
@ApiTags('Examinations')
@Controller('clinical-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR)
export class ClinicalOrdersController {
  constructor(private readonly clinicalOrdersService: ClinicalOrdersService) {}

  @Post()
  create(@Body() createClinicalOrderDto: CreateClinicalOrderDto) {
    return this.clinicalOrdersService.create(createClinicalOrderDto);
  }

  @Get()
  findAll() {
    return this.clinicalOrdersService.findAll();
  }

  @Get('patient/:patient_id')
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.clinicalOrdersService.findByPatientId(patient_id);
  }

  @Get('session/:session_id')
  findBySessionId(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.clinicalOrdersService.findBySessionId(session_id);
  }

  @Get('record/:record_id')
  findByRecordId(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.clinicalOrdersService.findByRecordId(record_id);
  }

  @Get('ordered-by/:ordered_by')
  findByOrderedBy(@Param('ordered_by', ParseUUIDPipe) ordered_by: string) {
    return this.clinicalOrdersService.findByOrderedBy(ordered_by);
  }

  @Get('status/:status')
  findByStatus(
    @Param('status', new ParseEnumPipe(OrderStatus)) status: OrderStatus,
  ) {
    return this.clinicalOrdersService.findByStatus(status);
  }

  @Get(':order_id')
  findOne(@Param('order_id', ParseUUIDPipe) order_id: string) {
    return this.clinicalOrdersService.findOne(order_id);
  }

  @Patch(':order_id')
  update(
    @Param('order_id', ParseUUIDPipe) order_id: string,
    @Body() updateClinicalOrderDto: UpdateClinicalOrderDto,
  ) {
    return this.clinicalOrdersService.update(order_id, updateClinicalOrderDto);
  }

  @Delete(':order_id')
  remove(@Param('order_id', ParseUUIDPipe) order_id: string) {
    return this.clinicalOrdersService.remove(order_id);
  }
}
