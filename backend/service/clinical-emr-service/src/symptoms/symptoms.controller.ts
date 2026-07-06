import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SymptomsService } from './symptoms.service';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

// Staff/clinician-only — patient PHI; a PATIENT must not reach these endpoints.
@ApiTags('Examinations')
@Controller('symptoms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
export class SymptomsController {
  constructor(private readonly symptomsService: SymptomsService) {}

  @Post()
  create(@Body() createSymptomDto: CreateSymptomDto) {
    return this.symptomsService.create(createSymptomDto);
  }

  @Get()
  findAll() {
    return this.symptomsService.findAll();
  }

  @Get(':symptom_id')
  findOne(@Param('symptom_id', ParseUUIDPipe) symptom_id: string) {
    return this.symptomsService.findOne(symptom_id);
  }

  @Get('session/:session_id')
  findBySessionId(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.symptomsService.findBySessionId(session_id);
  }

  @Get('patient/:patient_id')
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.symptomsService.findByPatientId(patient_id);
  }

  @Patch(':symptom_id')
  update(
    @Param('symptom_id', ParseUUIDPipe) symptom_id: string,
    @Body() updateSymptomDto: UpdateSymptomDto,
  ) {
    return this.symptomsService.update(symptom_id, updateSymptomDto);
  }

  @Delete(':symptom_id')
  remove(@Param('symptom_id', ParseUUIDPipe) symptom_id: string) {
    return this.symptomsService.remove(symptom_id);
  }
}
