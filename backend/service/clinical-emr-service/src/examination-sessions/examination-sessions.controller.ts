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
import { ExaminationSessionsService } from './examination-sessions.service';
import { CreateExaminationSessionDto } from './dto/create-examination-session.dto';
import { UpdateExaminationSessionDto } from './dto/update-examination-session.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';

@ApiTags('Examinations')
@Controller('examination-sessions')
// Staff/clinician-only — patient PHI; a PATIENT must not reach these endpoints.
@Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
export class ExaminationSessionsController {
  constructor(
    private readonly examinationSessionsService: ExaminationSessionsService,
  ) {}

  @Post()
  create(@Body() createExaminationSessionDto: CreateExaminationSessionDto) {
    return this.examinationSessionsService.create(createExaminationSessionDto);
  }

  @Get()
  findAll() {
    return this.examinationSessionsService.findAll();
  }

  @Get(':session_id')
  findOne(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.examinationSessionsService.findOne(session_id);
  }

  @Get('patient/:patient_id')
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.examinationSessionsService.findByPatientId(patient_id);
  }

  @Get('doctor/:doctor_id')
  findByDoctorId(@Param('doctor_id', ParseUUIDPipe) doctor_id: string) {
    return this.examinationSessionsService.findByDoctorId(doctor_id);
  }

  @Get('appointment/:appointment_id')
  findByAppointmentId(
    @Param('appointment_id', ParseUUIDPipe) appointment_id: string,
  ) {
    return this.examinationSessionsService.findByAppointmentId(appointment_id);
  }

  @Patch(':session_id')
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
