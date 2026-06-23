import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Headers,
  HttpStatus,
  HttpCode,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ChangeAppointmentStatusDto } from './dto/change-appointment-status.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { BookBySpecialtyDto } from './dto/book-by-specialty.dto';
import { BookByDoctorDto } from './dto/book-by-doctor.dto';
import { BookOutsideHoursDto } from './dto/book-outside-hours.dto';
import { QueryAppointmentAvailabilityDto } from './dto/query-appointment-availability.dto';
import { AppointmentAvailabilityService } from './appointment-availability.service';
import { BookAppointmentOptionDto } from './dto/book-appointment-option.dto';
import { RescheduleAppointmentOptionDto } from './dto/reschedule-appointment-option.dto';

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
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly availabilityService: AppointmentAvailabilityService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-048/049/050: Create appointment' })
  create(
    @Body() dto: CreateAppointmentDto,
    @Headers('x-auth-user-id') actorUserId?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.create(dto, actorUserId);
  }

  @Post('by-specialty')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'UC-049: Create appointment by specialty — auto-selects available doctor',
  })
  createBySpecialty(
    @Body() dto: BookBySpecialtyDto,
    @Headers('x-auth-user-id') actorUserId?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.createBySpecialty(dto, actorUserId);
  }

  @Post('by-doctor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'UC-050: Create appointment by specific doctor — validates schedule availability',
  })
  createByDoctor(
    @Body() dto: BookByDoctorDto,
    @Headers('x-auth-user-id') actorUserId?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.createByDoctor(dto, actorUserId);
  }

  @Post('book-option')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Book appointment from a signed availability option token',
  })
  createByOption(
    @Body() dto: BookAppointmentOptionDto,
    @Headers('x-auth-user-id') actorUserId?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.createByOption(dto, actorUserId);
  }

  @Post('outside-hours')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-051: Create appointment outside regular working hours',
  })
  createOutsideHours(
    @Body() dto: BookOutsideHoursDto,
    @Headers('x-auth-user-id') actorUserId?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.createOutsideHours(dto, actorUserId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List appointments with filters' })
  findAll(
    @Query() query: QueryAppointmentDto,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.findAll(query, actorUserId, actorRole);
  }

  @Get('availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find canonical appointment availability' })
  findAvailability(
    @Query() query: QueryAppointmentAvailabilityDto,
    @Headers('x-auth-user-id') actorUserId?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.availabilityService.findAvailability(query, actorUserId);
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get appointment by code' })
  @ApiParam({
    name: 'code',
    description: 'Appointment code (APT-YYYYMMDD-XXXX)',
  })
  async findByCode(
    @Param('code') code: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    const appointment = await this.appointmentsService.findByCode(
      code,
      actorUserId,
      actorRole,
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
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.rescheduleByOption(
      id,
      dto,
      actorUserId,
      actorRole,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update appointment details' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.update(id, dto, actorUserId, actorRole);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-052: Change appointment status' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeAppointmentStatusDto,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.changeStatus(
      id,
      dto,
      actorUserId,
      actorRole,
    );
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-052: Confirm appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  confirm(
    @Param('id') id: string,
    @Body('changed_by') changedBy: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    if (!changedBy) {
      throw new BadRequestException('changed_by logic is required');
    }
    return this.appointmentsService.confirm(
      id,
      actorUserId ?? changedBy,
      actorRole,
    );
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-053: Cancel appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.cancel(id, dto, actorUserId, actorRole);
  }

  @Patch(':id/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check in a patient for a scheduled or confirmed appointment',
  })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  checkIn(
    @Param('id') id: string,
    @Body('checked_in_by') checkedInBy: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    if (!checkedInBy) {
      throw new BadRequestException('checked_in_by is required');
    }
    return this.appointmentsService.checkIn(
      id,
      actorUserId ?? checkedInBy,
      actorRole,
    );
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get appointment status change history' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  getStatusHistory(
    @Param('id') id: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.getStatusHistory(
      id,
      actorUserId,
      actorRole,
    );
  }

  @Get('patient/:patientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-061: Get appointments by patient (chatbot)' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  findByPatient(
    @Param('patientId') patientId: string,
    @Query('status') status?: string,
    @Headers('x-auth-user-id') actorUserId?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.findByPatient(
      patientId,
      status,
      actorUserId,
    );
  }

  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-061: Get appointments by doctor (chatbot)' })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID' })
  findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('date') date?: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.findByDoctor(
      doctorId,
      date,
      actorUserId,
      actorRole,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get appointment detail by ID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  async findOne(
    @Param('id') id: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    const appointment = await this.appointmentsService.findById(
      id,
      actorUserId,
      actorRole,
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
  sendConfirmation(
    @Param('id') id: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.sendConfirmation(
      id,
      actorUserId,
      actorRole,
    );
  }

  @Post(':id/notifications/reminder')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send appointment reminder notification' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  sendReminder(
    @Param('id') id: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
    return this.appointmentsService.sendReminder(id, actorUserId, actorRole);
  }
}
