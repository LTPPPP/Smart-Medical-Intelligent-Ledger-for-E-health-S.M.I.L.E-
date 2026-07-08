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
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CurrentActor } from '../auth/current-actor.decorator';
import { Actor } from '../auth/actor.util';

@ApiTags('Medical Records')
@Controller('medical-records')
// Staff/clinician-only — patient PHI; a PATIENT must not reach these endpoints.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
export class MedicalRecordsController {
  constructor(private readonly service: MedicalRecordsService) {}

  @Post()
  create(@Body() dto: CreateMedicalRecordDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@CurrentActor() actor?: Actor) {
    return this.service.findAll(actor);
  }

  @Get('patient/:patient_id')
  findByPatient(
    @Param('patient_id', ParseUUIDPipe) patient_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.service.findByPatient(patient_id, actor);
  }

  @Get(':record_id')
  findOne(
    @Param('record_id', ParseUUIDPipe) record_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.service.findOne(record_id, actor);
  }

  @Get(':record_id/versions')
  getVersions(
    @Param('record_id', ParseUUIDPipe) record_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.service.getVersions(record_id, actor);
  }

  @Patch(':record_id/finalize')
  finalize(
    @Param('record_id', ParseUUIDPipe) record_id: string,
    @Body('finalized_by') finalized_by?: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.service.finalize(record_id, finalized_by, actor);
  }

  @Patch(':record_id')
  update(
    @Param('record_id', ParseUUIDPipe) record_id: string,
    @Body() dto: UpdateMedicalRecordDto,
    @CurrentActor() actor?: Actor,
  ) {
    return this.service.update(record_id, dto, actor);
  }

  @Delete(':record_id')
  remove(
    @Param('record_id', ParseUUIDPipe) record_id: string,
    @CurrentActor() actor?: Actor,
  ) {
    return this.service.remove(record_id, actor);
  }
}
