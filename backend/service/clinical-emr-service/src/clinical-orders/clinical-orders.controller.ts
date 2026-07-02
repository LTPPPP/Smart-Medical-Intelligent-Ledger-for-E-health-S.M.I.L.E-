import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClinicalOrdersService } from './clinical-orders.service';
import { CreateClinicalOrderDto } from './dto/create-clinical-order.dto';
import { UpdateClinicalOrderDto } from './dto/update-clinical-order.dto';

@ApiTags('Examinations')
@Controller('clinical-orders')
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

  @Get('record/:record_id')
  findByRecordId(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.clinicalOrdersService.findByRecordId(record_id);
  }

  @Get('ordered-by/:ordered_by')
  findByOrderedBy(@Param('ordered_by', ParseUUIDPipe) ordered_by: string) {
    return this.clinicalOrdersService.findByOrderedBy(ordered_by);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: string) {
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
