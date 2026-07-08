import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

// The patient directory holds PHI of every patient — staff only. A PATIENT must never
// reach it (the disqualifying audit finding: a logged-in patient could list/edit/delete
// the whole directory). Patients use their own profile (iam) + appointments instead.
@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }

  @Get('me')
  @Roles(RoleEnum.PATIENT)
  findMine(@Headers('x-auth-user-id') userId?: string) {
    if (!userId) {
      return null;
    }
    return this.patientsService.findByUserId(userId);
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
  @Roles(RoleEnum.ADMIN)
  remove(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.patientsService.remove(patient_id);
  }
}
