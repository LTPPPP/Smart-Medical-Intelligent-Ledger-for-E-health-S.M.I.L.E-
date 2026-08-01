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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreateMyPatientDto } from './dto/create-my-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CurrentActor } from '../auth/current-actor.decorator';
import { Actor } from '../auth/actor.util';

// Staff Only Directory
@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(RoleEnum.MANAGER, RoleEnum.RECEPTIONIST)
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  // Nurse Read Only
  @Get()
  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
    RoleEnum.NURSE,
  )
  findAll() {
    return this.patientsService.findAll();
  }

  // Self Service Lookup
  @Get('me')
  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
    RoleEnum.NURSE,
    RoleEnum.PATIENT,
  )
  findMine(@CurrentActor() actor: Actor) {
    return this.patientsService.findByUserId(actor.accountId);
  }

  // Self Provision Record
  @Post('me')
  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
    RoleEnum.NURSE,
    RoleEnum.PATIENT,
  )
  createMine(@CurrentActor() actor: Actor, @Body() dto: CreateMyPatientDto) {
    return this.patientsService.createForSelf(actor.accountId, dto);
  }

  @Get(':patient_id')
  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
    RoleEnum.NURSE,
  )
  findOne(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.patientsService.findOne(patient_id);
  }

  @Get('code/:patient_code')
  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
    RoleEnum.NURSE,
  )
  findByCode(@Param('patient_code') patient_code: string) {
    return this.patientsService.findByCode(patient_code);
  }

  @Patch(':patient_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.RECEPTIONIST)
  update(
    @Param('patient_id', ParseUUIDPipe) patient_id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(patient_id, updatePatientDto);
  }

  @Delete(':patient_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
  remove(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.patientsService.remove(patient_id);
  }

  // Manual Unblock Override
  @Patch(':patient_id/unblock-booking')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
  unblockBooking(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.patientsService.unblockBooking(patient_id);
  }
}
