import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MedicalCertificatesService } from './medical-certificates.service';
import { CreateMedicalCertificateDto } from './dto/create-medical-certificate.dto';

@ApiTags('Medical Certificates')
@Controller('medical-certificates')
export class MedicalCertificatesController {
  constructor(private readonly service: MedicalCertificatesService) {}

  @Post()
  create(@Body() dto: CreateMedicalCertificateDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':cert_id')
  findOne(@Param('cert_id', ParseUUIDPipe) cert_id: string) {
    return this.service.findOne(cert_id);
  }

  @Get('session/:session_id')
  findBySessionId(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.service.findBySessionId(session_id);
  }

  @Get('patient/:patient_id')
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.service.findByPatientId(patient_id);
  }

  /** Hủy giấy chứng nhận — yêu cầu doctor_id và void_reason */
  @Patch(':cert_id/void')
  void(
    @Param('cert_id', ParseUUIDPipe) cert_id: string,
    @Body('voided_by', ParseUUIDPipe) voided_by: string,
    @Body('void_reason') void_reason: string,
  ) {
    return this.service.void(cert_id, voided_by, void_reason);
  }
}
