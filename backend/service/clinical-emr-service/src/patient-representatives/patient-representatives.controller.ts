import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePatientRepresentativeDto } from './dto/create-patient-representative.dto';
import { UpdatePatientRepresentativeDto } from './dto/update-patient-representative.dto';
import { PatientRepresentativesService } from './patient-representatives.service';

@ApiTags('Patient Representatives')
@Controller('patient-representatives')
export class PatientRepresentativesController {
  constructor(
    private readonly patientRepresentativesService: PatientRepresentativesService,
  ) {}

  @Post()
  create(@Body() dto: CreatePatientRepresentativeDto) {
    return this.patientRepresentativesService.create(dto);
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.patientRepresentativesService.findByPatient(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientRepresentativesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientRepresentativeDto,
  ) {
    return this.patientRepresentativesService.update(id, dto);
  }
}
