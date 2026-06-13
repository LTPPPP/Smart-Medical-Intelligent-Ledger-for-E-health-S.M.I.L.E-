import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ChangeAppointmentStatusDto } from './dto/change-appointment-status.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { BookBySpecialtyDto } from './dto/book-by-specialty.dto';
import { BookByDoctorDto } from './dto/book-by-doctor.dto';
import { BookOutsideHoursDto } from './dto/book-outside-hours.dto';

@ApiTags('Appointments')
@Controller({
  path: 'appointments',
  version: '1',
})
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-048/049/050: Create appointment' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Post('by-specialty')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'UC-049: Create appointment by specialty — auto-selects available doctor',
  })
  createBySpecialty(@Body() dto: BookBySpecialtyDto) {
    return this.appointmentsService.createBySpecialty(dto);
  }

  @Post('by-doctor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'UC-050: Create appointment by specific doctor — validates schedule availability',
  })
  createByDoctor(@Body() dto: BookByDoctorDto) {
    return this.appointmentsService.createByDoctor(dto);
  }

  @Post('outside-hours')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-051: Create appointment outside regular working hours',
  })
  createOutsideHours(@Body() dto: BookOutsideHoursDto) {
    return this.appointmentsService.createOutsideHours(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List appointments with filters' })
  findAll(@Query() query: QueryAppointmentDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get appointment by code' })
  @ApiParam({
    name: 'code',
    description: 'Appointment code (APT-YYYYMMDD-XXXX)',
  })
  async findByCode(@Param('code') code: string) {
    const appointment = await this.appointmentsService.findByCode(code);
    if (!appointment) {
      throw new NotFoundException(`Appointment with code ${code} not found`);
    }
    return appointment;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update appointment details' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-052: Change appointment status' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeAppointmentStatusDto,
  ) {
    return this.appointmentsService.changeStatus(id, dto);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-052: Confirm appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  confirm(@Param('id') id: string, @Body('changed_by') changedBy: string) {
    if (!changedBy) {
      throw new BadRequestException('changed_by logic is required');
    }
    return this.appointmentsService.confirm(id, changedBy);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-053: Cancel appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointmentsService.cancel(id, dto);
  }

  @Patch(':id/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check in a patient for a scheduled or confirmed appointment',
  })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  checkIn(@Param('id') id: string, @Body('checked_in_by') checkedInBy: string) {
    if (!checkedInBy) {
      throw new BadRequestException('checked_in_by is required');
    }
    return this.appointmentsService.checkIn(id, checkedInBy);
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get appointment status change history' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  getStatusHistory(@Param('id') id: string) {
    return this.appointmentsService.getStatusHistory(id);
  }

  @Get('patient/:patientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-061: Get appointments by patient (chatbot)' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  findByPatient(
    @Param('patientId') patientId: string,
    @Query('status') status?: string,
  ) {
    return this.appointmentsService.findByPatient(patientId, status);
  }

  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-061: Get appointments by doctor (chatbot)' })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID' })
  findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findByDoctor(doctorId, date);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get appointment detail by ID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  async findOne(@Param('id') id: string) {
    const appointment = await this.appointmentsService.findById(id);
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appointment;
  }

  @Post(':id/notifications/confirmation')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send appointment confirmation notification' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  sendConfirmation(@Param('id') id: string) {
    return this.appointmentsService.sendConfirmation(id);
  }

  @Post(':id/notifications/reminder')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send appointment reminder notification' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  sendReminder(@Param('id') id: string) {
    return this.appointmentsService.sendReminder(id);
  }
}
