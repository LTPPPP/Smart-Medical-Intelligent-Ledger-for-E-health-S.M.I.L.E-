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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add Patient Profile' })
  @ApiCreatedResponse({ type: PatientResponseDto, description: 'Patient created' })
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all patients' })
  @ApiOkResponse({ type: [PatientResponseDto] })
  findAll() {
    return this.patientsService.findAll();
  }

  @Get(':patient_id')
  @ApiOperation({ summary: 'View Patient Profile by ID' })
  @ApiOkResponse({ type: PatientResponseDto })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  findOne(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.patientsService.findOne(patient_id);
  }

  @Get('code/:patient_code')
  @ApiOperation({ summary: 'View Patient Profile by code' })
  @ApiOkResponse({ type: PatientResponseDto })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  findByCode(@Param('patient_code') patient_code: string) {
    return this.patientsService.findByCode(patient_code);
  }

  @Patch(':patient_id')
  @ApiOperation({ summary: 'Update Patient Profile' })
  @ApiOkResponse({ type: PatientResponseDto })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  update(
    @Param('patient_id', ParseUUIDPipe) patient_id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(patient_id, updatePatientDto);
  }

  @Delete(':patient_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Patient Profile' })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  remove(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.patientsService.remove(patient_id);
  }
}
