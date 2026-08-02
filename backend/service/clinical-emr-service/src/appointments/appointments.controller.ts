import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseEnumPipe,
  HttpStatus,
  HttpCode,
  NotFoundException,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentActor } from '../auth/current-actor.decorator';
import { Actor } from '../auth/actor.util';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ChangeAppointmentStatusDto } from './dto/change-appointment-status.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { BookBySpecialtyDto } from './dto/book-by-specialty.dto';
import { BookByClinicDto } from './dto/book-by-clinic.dto';
import { CheckInAssignDto } from './dto/check-in-assign.dto';
import { BookByDoctorDto } from './dto/book-by-doctor.dto';
import { BookOutsideHoursDto } from './dto/book-outside-hours.dto';
import { QueryAppointmentAvailabilityDto } from './dto/query-appointment-availability.dto';
import { AppointmentAvailabilityService } from './appointment-availability.service';
import { BookAppointmentOptionDto } from './dto/book-appointment-option.dto';
import { RescheduleAppointmentOptionDto } from './dto/reschedule-appointment-option.dto';
import { UpdateReminderPreferenceDto } from './dto/update-reminder-preference.dto';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';

@ApiTags('Appointments')
@ApiHeader({
  name: 'Idempotency-Key',
  required: false,
  description: 'Optional key for safe retries of appointment booking requests.',
})
@UseInterceptors(IdempotencyInterceptor)
@Controller({
  path: 'appointments',
  version: '1',
})
// Row-Level Ownership Check
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly availabilityService: AppointmentAvailabilityService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-048/049/050: Create appointment' })
  create(@Body() dto: CreateAppointmentDto, @CurrentActor() actor: Actor) {
    return this.appointmentsService.create(dto, actor.accountId, actor.role);
  }

  @Post('by-clinic')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'UC-048: Create appointment by clinic only — auto-selects an available doctor',
  })
  createByClinic(@Body() dto: BookByClinicDto, @CurrentActor() actor: Actor) {
    return this.appointmentsService.createByClinic(
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Post('by-specialty')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'UC-049: Create appointment by specialty — auto-selects available doctor',
  })
  createBySpecialty(
    @Body() dto: BookBySpecialtyDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.appointmentsService.createBySpecialty(
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Post('by-doctor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'UC-050: Create appointment by specific doctor — validates schedule availability',
  })
  createByDoctor(@Body() dto: BookByDoctorDto, @CurrentActor() actor: Actor) {
    return this.appointmentsService.createByDoctor(
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Post('book-option')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Book appointment from a signed availability option token',
  })
  createByOption(
    @Body() dto: BookAppointmentOptionDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.appointmentsService.createByOption(
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Post('outside-hours')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-051: Create appointment outside regular working hours',
  })
  createOutsideHours(
    @Body() dto: BookOutsideHoursDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.appointmentsService.createOutsideHours(
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List appointments with filters' })
  findAll(@Query() query: QueryAppointmentDto, @CurrentActor() actor: Actor) {
    return this.appointmentsService.findAll(query, actor.accountId, actor.role);
  }

  @Get('availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find canonical appointment availability' })
  findAvailability(
    @Query() query: QueryAppointmentAvailabilityDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.availabilityService.findAvailability(query, actor.accountId);
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get appointment by code' })
  @ApiParam({
    name: 'code',
    description: 'Appointment code (APT-YYYYMMDD-XXXX)',
  })
  async findByCode(@Param('code') code: string, @CurrentActor() actor: Actor) {
    const appointment = await this.appointmentsService.findByCode(
      code,
      actor.accountId,
      actor.role,
    );
    if (!appointment) {
      throw new NotFoundException(`Appointment with code ${code} not found`);
    }
    return appointment;
  }

  @Patch(':id/reschedule-option')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reschedule appointment from a signed availability option token',
  })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  rescheduleByOption(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentOptionDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.appointmentsService.rescheduleByOption(
      id,
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update appointment details' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.appointmentsService.update(
      id,
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-052: Change appointment status' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeAppointmentStatusDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.appointmentsService.changeStatus(
      id,
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-052: Confirm appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  confirm(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.appointmentsService.confirm(id, actor.accountId, actor.role);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-053: Cancel appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.appointmentsService.cancel(
      id,
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Patch(':id/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check in a patient for a scheduled or confirmed appointment',
  })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  checkIn(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.appointmentsService.checkIn(id, actor.accountId, actor.role);
  }

  @Patch(':id/check-in-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Front-desk arrival: assign the real doctor/service/room and check the patient in',
  })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  checkInAndAssign(
    @Param('id') id: string,
    @Body() dto: CheckInAssignDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.appointmentsService.checkInAndAssign(
      id,
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get appointment status change history' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  getStatusHistory(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.appointmentsService.getStatusHistory(
      id,
      actor.accountId,
      actor.role,
    );
  }

  @Get('patient/:patientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-061: Get appointments by patient (chatbot)' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  findByPatient(
    @Param('patientId') patientId: string,
    @CurrentActor() actor: Actor,
    @Query('status', new ParseEnumPipe(AppointmentStatus, { optional: true }))
    status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findByPatient(
      patientId,
      status,
      actor.accountId,
      actor.role,
    );
  }

  @Get('doctor/:doctorId/worklist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get checked-in appointments ready for doctor examination',
  })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID' })
  findDoctorWorklist(
    @Param('doctorId') doctorId: string,
    @CurrentActor() actor: Actor,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findDoctorWorklist(
      doctorId,
      date,
      actor.accountId,
      actor.role,
    );
  }

  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-061: Get appointments by doctor (chatbot)' })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID' })
  findByDoctor(
    @Param('doctorId') doctorId: string,
    @CurrentActor() actor: Actor,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findByDoctor(
      doctorId,
      date,
      actor.accountId,
      actor.role,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get appointment detail by ID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  async findOne(@Param('id') id: string, @CurrentActor() actor: Actor) {
    const appointment = await this.appointmentsService.findById(
      id,
      actor.accountId,
      actor.role,
    );
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appointment;
  }

  @Post(':id/notifications/confirmation')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send appointment confirmation notification' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  sendConfirmation(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.appointmentsService.sendConfirmation(
      id,
      actor.accountId,
      actor.role,
    );
  }

  @Post(':id/notifications/reminder')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send appointment reminder notification' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  sendReminder(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.appointmentsService.sendReminder(
      id,
      actor.accountId,
      actor.role,
    );
  }

  @Post(':id/notifications/reminder/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Retry the latest failed appointment reminder' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  retryReminder(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.appointmentsService.retryReminder(
      id,
      actor.accountId,
      actor.role,
    );
  }

  @Patch(':id/notifications/reminder-preference')
  @ApiOperation({ summary: 'Update appointment reminder preference' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  updateReminderPreference(
    @Param('id') id: string,
    @Body() dto: UpdateReminderPreferenceDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.appointmentsService.setReminderPreferenceForAppointment(
      id,
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Get(':id/notifications/reminder-preference')
  @ApiOperation({ summary: 'Get appointment reminder preference' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  getReminderPreference(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.appointmentsService.getReminderPreferenceForAppointment(
      id,
      actor.accountId,
      actor.role,
    );
  }

  @Patch(':id/notifications/reminder/read')
  @ApiOperation({ summary: 'Mark latest appointment reminder as read' })
  markReminderRead(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.appointmentsService.markReminderRead(
      id,
      actor.accountId,
      actor.role,
    );
  }

  @Patch(':id/notifications/reminder/responded')
  @ApiOperation({ summary: 'Mark latest appointment reminder as responded' })
  markReminderResponded(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.appointmentsService.markReminderResponded(
      id,
      actor.accountId,
      actor.role,
    );
  }

  @Get(':id/notifications/logs')
  @ApiOperation({ summary: 'List appointment notification logs' })
  findNotificationLogs(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.appointmentsService.findNotificationLogs(
      id,
      actor.accountId,
      actor.role,
    );
  }
}
