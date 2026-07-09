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
import { ExaminationSessionsService } from './examination-sessions.service';
import { CreateExaminationSessionDto } from './dto/create-examination-session.dto';
import { UpdateExaminationSessionDto } from './dto/update-examination-session.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { CreateExaminationAmendmentDto } from './dto/create-examination-amendment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Examinations')
@Controller('examination-sessions')
// Staff/clinician-only — patient PHI; a PATIENT must not reach these endpoints.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
export class ExaminationSessionsController {
  constructor(
    private readonly examinationSessionsService: ExaminationSessionsService,
  ) {}

  @Post()
  create(@Body() createExaminationSessionDto: CreateExaminationSessionDto) {
    return this.examinationSessionsService.create(createExaminationSessionDto);
  }

  // Reads + draft updates are open to Nurse too — B3.3: nurse records vitals/
  // pre-exam data into the session as a draft for doctor review before sign.
  // create/delete/finalize/amendments stay Doctor/Admin-only (class default).
  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findAll() {
    return this.examinationSessionsService.findAll();
  }

  @Get('patient/:patient_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.examinationSessionsService.findByPatientId(patient_id);
  }

  @Get('doctor/:doctor_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findByDoctorId(@Param('doctor_id', ParseUUIDPipe) doctor_id: string) {
    return this.examinationSessionsService.findByDoctorId(doctor_id);
  }

  @Get('appointment/:appointment_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findByAppointmentId(
    @Param('appointment_id', ParseUUIDPipe) appointment_id: string,
  ) {
    return this.examinationSessionsService.findByAppointmentId(appointment_id);
  }

  @Get(':session_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findOne(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.examinationSessionsService.findOne(session_id);
  }

  @Get(':session_id/amendments')
  findAmendments(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.examinationSessionsService.findAmendments(session_id);
  }

  @Post(':session_id/amendments')
  createAmendment(
    @Param('session_id', ParseUUIDPipe) session_id: string,
    @Body() dto: CreateExaminationAmendmentDto,
  ) {
    return this.examinationSessionsService.createAmendment(session_id, dto);
  }

  @Patch(':session_id/finalize')
  finalize(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.examinationSessionsService.finalize(session_id);
  }

  @Patch(':session_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  update(
    @Param('session_id', ParseUUIDPipe) session_id: string,
    @Body() updateExaminationSessionDto: UpdateExaminationSessionDto,
  ) {
    return this.examinationSessionsService.update(
      session_id,
      updateExaminationSessionDto,
    );
  }

  @Delete(':session_id')
  remove(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.examinationSessionsService.remove(session_id);
  }
}
