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
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

@ApiTags('Prescriptions')
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  create(@Body() createPrescriptionDto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(createPrescriptionDto);
  }

  @Get()
  findAll() {
    return this.prescriptionsService.findAll();
  }

  @Get('patient/:patient_id')
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.prescriptionsService.findByPatientId(patient_id);
  }

  @Get('doctor/:doctor_id')
  findByDoctorId(@Param('doctor_id', ParseUUIDPipe) doctor_id: string) {
    return this.prescriptionsService.findByDoctorId(doctor_id);
  }

  @Get('session/:session_id')
  findBySessionId(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.prescriptionsService.findBySessionId(session_id);
  }

  @Get('record/:record_id')
  findByRecordId(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.prescriptionsService.findByRecordId(record_id);
  }

  @Get(':prescription_id')
  findOne(@Param('prescription_id', ParseUUIDPipe) prescription_id: string) {
    return this.prescriptionsService.findOne(prescription_id);
  }

  @Patch(':prescription_id/issue')
  issue(@Param('prescription_id', ParseUUIDPipe) prescription_id: string) {
    return this.prescriptionsService.issue(prescription_id);
  }

  @Patch(':prescription_id/cancel')
  cancel(
    @Param('prescription_id', ParseUUIDPipe) prescription_id: string,
    @Body('reason') reason: string,
  ) {
    return this.prescriptionsService.cancel(prescription_id, reason);
  }

  @Patch(':prescription_id')
  update(
    @Param('prescription_id', ParseUUIDPipe) prescription_id: string,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
  ) {
    return this.prescriptionsService.update(
      prescription_id,
      updatePrescriptionDto,
    );
  }

  @Delete(':prescription_id')
  remove(@Param('prescription_id', ParseUUIDPipe) prescription_id: string) {
    return this.prescriptionsService.remove(prescription_id);
  }
}
