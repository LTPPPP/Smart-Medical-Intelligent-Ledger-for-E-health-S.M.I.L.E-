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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }

  @Get(':patient_id')
  findOne(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.patientsService.findOne(patient_id);
  }

  @Get('code/:patient_code')
  findByCode(@Param('patient_code') patient_code: string) {
    return this.patientsService.findByCode(patient_code);
  }

  @Patch(':patient_id')
  update(
    @Param('patient_id', ParseUUIDPipe) patient_id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(patient_id, updatePatientDto);
  }

  @Delete(':patient_id')
  remove(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.patientsService.remove(patient_id);
  }
}
