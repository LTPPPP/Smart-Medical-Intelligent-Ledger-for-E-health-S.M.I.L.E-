import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AddToWaitlistRequest,
  AgentSchedulingService,
  CancelAppointmentRequest,
  ConfirmBookingRequest,
  HoldSlotRequest,
  ReleaseHoldRequest,
  RescheduleAppointmentRequest,
  SendEmailNotificationRequest,
} from './agent-scheduling.service';

@ApiTags('Agent Scheduling')
@Controller({
  version: '1',
})
export class AgentSchedulingController {
  constructor(
    private readonly agentSchedulingService: AgentSchedulingService,
  ) {}

  @Get('slots')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent tool: get available slots' })
  getAvailableSlots(
    @Query('clinic_id') clinicId?: string,
    @Query('dentist_id') dentistId?: string,
    @Query('service_id') serviceId?: string,
    @Query('date') date?: string,
  ) {
    return this.agentSchedulingService.getAvailableSlots({
      clinic_id: clinicId,
      dentist_id: dentistId,
      service_id: serviceId,
      date,
    });
  }

  @Post('slots/:slot_id/hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent tool: hold slot' })
  holdSlot(@Param('slot_id') slotId: string, @Body() body: HoldSlotRequest) {
    return this.agentSchedulingService.holdSlot({
      ...body,
      slot_id: slotId,
    });
  }

  @Post('bookings/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent tool: confirm booking' })
  confirmBooking(@Body() body: ConfirmBookingRequest) {
    return this.agentSchedulingService.confirmBooking(body);
  }

  @Post('holds/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent tool: release hold' })
  releaseHold(@Body() body: ReleaseHoldRequest) {
    return this.agentSchedulingService.releaseHold(body);
  }

  @Post('appointments/:appointment_id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent tool: cancel appointment' })
  cancelAppointment(
    @Param('appointment_id') appointmentId: string,
    @Body() body: Omit<CancelAppointmentRequest, 'appointment_id'>,
  ) {
    return this.agentSchedulingService.cancelAppointment({
      ...body,
      appointment_id: appointmentId,
    });
  }

  @Post('appointments/:appointment_id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent tool: reschedule appointment' })
  rescheduleAppointment(
    @Param('appointment_id') appointmentId: string,
    @Body() body: Omit<RescheduleAppointmentRequest, 'appointment_id'>,
  ) {
    return this.agentSchedulingService.rescheduleAppointment({
      ...body,
      appointment_id: appointmentId,
    });
  }

  @Post('waitlist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent tool: add to waitlist' })
  addToWaitlist(@Body() body: AddToWaitlistRequest) {
    return this.agentSchedulingService.addToWaitlist(body);
  }

  @Get('waitlist/matches/:slot_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent tool: check waitlist matches' })
  checkWaitlistMatches(@Param('slot_id') slotId: string) {
    return this.agentSchedulingService.checkWaitlistMatches(slotId);
  }

  @Post('agent/email-notifications')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Agent tool: queue trusted email notification' })
  sendEmailNotification(@Body() body: SendEmailNotificationRequest) {
    return this.agentSchedulingService.sendEmailNotification(body);
  }

  @Post('agent/medical-risk/classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent tool: classify medical risk' })
  classifyMedicalRisk(@Body('message') message: string) {
    return this.agentSchedulingService.classifyMedicalRisk(message);
  }

  @Post('agent/handoff-tickets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agent tool: create handoff ticket' })
  createHandoffTicket(
    @Body()
    body: {
      session_id: string;
      patient_id?: string;
      source_message: string;
      summary: string;
    },
  ) {
    return this.agentSchedulingService.createHandoffTicket(body);
  }

  @Post('agent/summaries/dentist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agent tool: summarize message for dentist' })
  summarizeForDentist(@Body('message') message: string) {
    return this.agentSchedulingService.summarizeForDentist(message);
  }
}
