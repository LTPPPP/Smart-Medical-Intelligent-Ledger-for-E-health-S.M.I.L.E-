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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';
import { PatientsService } from '../patients/patients.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Medical Records')
@Controller('medical-records')
// Staff Only Phi
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR)
export class MedicalRecordsController {
  constructor(
    private readonly service: MedicalRecordsService,
    private readonly patientsService: PatientsService,
  ) {}

  @Post()
  create(@Body() dto: CreateMedicalRecordDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('patient/:patient_id')
  findByPatient(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.service.findByPatient(patient_id);
  }

  // Own Finalized History
  @Get('me')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.PATIENT)
  async findMine(@Headers('x-auth-user-id') userId?: string) {
    if (!userId) throw new UnauthorizedException();
    const patient = await this.patientsService.findByUserId(userId);
    if (!patient) return [];
    return this.service.findMineList(patient.patient_id);
  }

  @Get('me/:record_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.PATIENT)
  async findMineOne(
    @Headers('x-auth-user-id') userId: string | undefined,
    @Param('record_id', ParseUUIDPipe) record_id: string,
  ) {
    if (!userId) throw new UnauthorizedException();
    const patient = await this.patientsService.findByUserId(userId);
    if (!patient) throw new UnauthorizedException();
    return this.service.findMineDetail(patient.patient_id, record_id);
  }

  @Get(':record_id')
  findOne(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.service.findOne(record_id);
  }

  @Get(':record_id/versions')
  getVersions(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.service.getVersions(record_id);
  }

  @Patch(':record_id/finalize')
  finalize(
    @Param('record_id', ParseUUIDPipe) record_id: string,
    @Body('finalized_by') finalized_by?: string,
  ) {
    return this.service.finalize(record_id, finalized_by);
  }

  @Patch(':record_id')
  update(
    @Param('record_id', ParseUUIDPipe) record_id: string,
    @Body() dto: UpdateMedicalRecordDto,
  ) {
    return this.service.update(record_id, dto);
  }

  @Delete(':record_id')
  remove(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.service.remove(record_id);
  }
}
