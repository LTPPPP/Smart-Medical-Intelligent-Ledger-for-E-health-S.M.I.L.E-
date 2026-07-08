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
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CurrentActor } from '../auth/current-actor.decorator';
import { Actor } from '../auth/actor.util';

// Staff/clinician-only — patient PHI; a PATIENT must not reach these endpoints.
@ApiTags('Prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  create(@Body() createPrescriptionDto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(createPrescriptionDto);
  }

  @Get()
  findAll(@CurrentActor() actor?: Actor) {
    return this.prescriptionsService.findAll(actor);
  }

  @Get('patient/:patient_id')
  findByPatientId(
    @Param('patient_id', ParseUUIDPipe) patient_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.prescriptionsService.findByPatientId(patient_id, actor);
  }

  @Get('doctor/:doctor_id')
  findByDoctorId(
    @Param('doctor_id', ParseUUIDPipe) doctor_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.prescriptionsService.findByDoctorId(doctor_id, actor);
  }

  @Get('session/:session_id')
  findBySessionId(
    @Param('session_id', ParseUUIDPipe) session_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.prescriptionsService.findBySessionId(session_id, actor);
  }

  @Get('record/:record_id')
  findByRecordId(
    @Param('record_id', ParseUUIDPipe) record_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.prescriptionsService.findByRecordId(record_id, actor);
  }

  @Get(':prescription_id')
  findOne(
    @Param('prescription_id', ParseUUIDPipe) prescription_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.prescriptionsService.findOne(prescription_id, actor);
  }

  @Patch(':prescription_id/issue')
  issue(
    @Param('prescription_id', ParseUUIDPipe) prescription_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.prescriptionsService.issue(prescription_id, actor);
  }

  @Patch(':prescription_id/cancel')
  cancel(
    @Param('prescription_id', ParseUUIDPipe) prescription_id: string,
    @Body('reason') reason: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.prescriptionsService.cancel(prescription_id, reason, actor);
  }

  @Patch(':prescription_id')
  update(
    @Param('prescription_id', ParseUUIDPipe) prescription_id: string,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
    @CurrentActor() actor?: Actor,
  ) {
    return this.prescriptionsService.update(
      prescription_id,
      updatePrescriptionDto,
      actor,
    );
  }

  @Delete(':prescription_id')
  remove(
    @Param('prescription_id', ParseUUIDPipe) prescription_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.prescriptionsService.remove(prescription_id, actor);
  }
}
