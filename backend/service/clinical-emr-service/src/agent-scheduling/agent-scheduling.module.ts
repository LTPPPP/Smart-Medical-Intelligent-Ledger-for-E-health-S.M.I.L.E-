import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentStatusHistoryEntity } from '../appointments/entities/appointment-status-history.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { PatientEntity } from '../patients/entities/patient.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { AgentSchedulingController } from './agent-scheduling.controller';
import { AgentSchedulingService } from './agent-scheduling.service';
import { EmailOutboxEntity } from './entities/email-outbox.entity';
import { HandoffTicketEntity } from './entities/handoff-ticket.entity';
import { SlotHoldEntity } from './entities/slot-hold.entity';
import { SlotEntity } from './entities/slot.entity';
import { WaitlistEntryEntity } from './entities/waitlist-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        SlotEntity,
        SlotHoldEntity,
        WaitlistEntryEntity,
        EmailOutboxEntity,
        HandoffTicketEntity,
        AppointmentEntity,
        AppointmentStatusHistoryEntity,
        ServiceEntity,
        PatientEntity,
      ],
      'clinicConnection',
    ),
  ],
  controllers: [AgentSchedulingController],
  providers: [AgentSchedulingService],
  exports: [AgentSchedulingService],
})
export class AgentSchedulingModule {}
