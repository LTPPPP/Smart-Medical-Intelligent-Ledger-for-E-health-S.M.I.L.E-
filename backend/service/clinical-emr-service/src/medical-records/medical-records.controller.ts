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
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@ApiTags('Medical Records')
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly service: MedicalRecordsService) {}

  @Post()
  create(@Body() dto: CreateMedicalRecordDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('patient/:patient_id')
  findByPatient(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.service.findByPatient(patient_id);
  }

  @Get(':record_id')
  findOne(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.service.findOne(record_id);
  }

  @Get(':record_id/versions')
  getVersions(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.service.getVersions(record_id);
  }

  @Patch(':record_id')
  update(
    @Param('record_id', ParseUUIDPipe) record_id: string,
    @Body() dto: UpdateMedicalRecordDto,
  ) {
    return this.service.update(record_id, dto);
  }

  @Delete(':record_id')
  remove(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.service.remove(record_id);
  }
}
