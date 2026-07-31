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
  UnauthorizedException,
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

// The patient directory holds PHI of every patient — staff only. A PATIENT must never
// reach it (the disqualifying audit finding: a logged-in patient could list/edit/delete
// the whole directory). Patients use their own profile (iam) + appointments instead.
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

  // B3.8: nurse needs read-only access to the directory to identify/prep the
  // patient they're assisting — create/update/delete stay Reception/Admin.
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

  // Self-service lookup by the caller's own identity (x-auth-user-id) — must stay reachable
  // by PATIENT, unlike the rest of this staff-only controller (class-level @Roles above).
  @Get('me')
  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
    RoleEnum.NURSE,
    RoleEnum.PATIENT,
  )
  findMine(@Headers('x-auth-user-id') userId?: string) {
    if (!userId) {
      return null;
    }
    return this.patientsService.findByUserId(userId);
  }

  // Lets a PATIENT-role account provision its own directory row the first time
  // it's needed (e.g. from the booking wizard) — a brand-new registration/Google
  // sign-up has no row yet and would otherwise be stuck forever, since directory
  // create/update stays Reception/Admin-only above. `user_id` always comes from
  // the caller's own auth header, never the body, so this can only ever create
  // the caller's own record.
  @Post('me')
  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
    RoleEnum.NURSE,
    RoleEnum.PATIENT,
  )
  createMine(
    @Headers('x-auth-user-id') userId: string | undefined,
    @Body() dto: CreateMyPatientDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.patientsService.createForSelf(userId, dto);
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

  // Manual override for the auto-block set when a staff member finalizes a
  // cancellation for this patient — admin/manager only, by design.
  @Patch(':patient_id/unblock-booking')
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
  unblockBooking(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.patientsService.unblockBooking(patient_id);
  }
}
