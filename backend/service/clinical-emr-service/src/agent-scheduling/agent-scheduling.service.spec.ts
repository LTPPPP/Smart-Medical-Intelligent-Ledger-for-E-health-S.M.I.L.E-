import { AgentSchedulingService } from './agent-scheduling.service';
import { EmailOutboxEntity } from './entities/email-outbox.entity';
import { HandoffTicketEntity } from './entities/handoff-ticket.entity';
import { SlotHoldEntity } from './entities/slot-hold.entity';
import { SlotEntity } from './entities/slot.entity';
import { WaitlistEntryEntity } from './entities/waitlist-entry.entity';
import {
  EmailOutboxStatus,
  NotificationType,
  SlotHoldStatus,
  SlotStatus,
} from './enums/agent-scheduling.enum';

const slotId = '10000000-0000-0000-0000-000000000001';
const holdId = '20000000-0000-0000-0000-000000000001';
const appointmentId = '30000000-0000-0000-0000-000000000001';
const patientId = '40000000-0000-0000-0000-000000000001';
const serviceId = '50000000-0000-0000-0000-000000000001';
const clinicId = '60000000-0000-0000-0000-000000000001';
const doctorId = '70000000-0000-0000-0000-000000000001';

function createRepositoryMock<T extends object>() {
  return {
    create: jest.fn((value: Partial<T>) => value),
    save: jest.fn((value: Partial<T>) => Promise.resolve(value)),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
}

function createService() {
  const slotRepository = createRepositoryMock<SlotEntity>();
  const holdRepository = createRepositoryMock<SlotHoldEntity>();
  const appointmentRepository = createRepositoryMock<any>();
  const historyRepository = createRepositoryMock<any>();
  const serviceRepository = createRepositoryMock<any>();
  const patientRepository = createRepositoryMock<any>();
  const waitlistRepository = createRepositoryMock<WaitlistEntryEntity>();
  const emailOutboxRepository = createRepositoryMock<EmailOutboxEntity>();
  const handoffTicketRepository = createRepositoryMock<HandoffTicketEntity>();

  const repositories = new Map<any, any>([
    [SlotEntity, slotRepository],
    [SlotHoldEntity, holdRepository],
    [WaitlistEntryEntity, waitlistRepository],
    [EmailOutboxEntity, emailOutboxRepository],
    [HandoffTicketEntity, handoffTicketRepository],
  ]);

  const manager = {
    getRepository: jest.fn((entity) => repositories.get(entity)),
  };
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  };

  const service = new AgentSchedulingService(
    dataSource as any,
    slotRepository as any,
    holdRepository as any,
    appointmentRepository as any,
    historyRepository as any,
    serviceRepository as any,
    patientRepository as any,
    waitlistRepository as any,
    emailOutboxRepository as any,
    handoffTicketRepository as any,
  );

  return {
    service,
    slotRepository,
    holdRepository,
    appointmentRepository,
    historyRepository,
    serviceRepository,
    patientRepository,
    waitlistRepository,
    emailOutboxRepository,
    handoffTicketRepository,
  };
}

describe('AgentSchedulingService', () => {
  it('should hold an available slot atomically', async () => {
    const { service, slotRepository, holdRepository } = createService();
    slotRepository.findOne.mockResolvedValue({
      slot_id: slotId,
      status: SlotStatus.AVAILABLE,
      duration_minutes: 30,
    });
    holdRepository.save.mockResolvedValue({
      hold_id: holdId,
      slot_id: slotId,
      status: SlotHoldStatus.ACTIVE,
    });

    const result = await service.holdSlot({
      slot_id: slotId,
      patient_session_id: 'session-1',
      ttl_seconds: 300,
    });

    expect(result.success).toBe(true);
    expect(slotRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        slot_id: slotId,
        status: SlotStatus.HELD,
        held_by_session_id: 'session-1',
      }),
    );
    expect(holdRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        slot_id: slotId,
        patient_session_id: 'session-1',
        status: SlotHoldStatus.ACTIVE,
      }),
    );
  });

  it('should reject holding a booked slot with a structured error', async () => {
    const { service, slotRepository } = createService();
    slotRepository.findOne.mockResolvedValue({
      slot_id: slotId,
      status: SlotStatus.BOOKED,
    });

    const result = await service.holdSlot({
      slot_id: slotId,
      patient_session_id: 'session-2',
      ttl_seconds: 300,
    });

    expect(result).toEqual({
      success: false,
      error_code: 'SLOT_ALREADY_HELD_OR_BOOKED',
      message: 'This slot is no longer available.',
      recommended_action: 'GET_AVAILABLE_SLOTS_AGAIN',
    });
  });

  it('should reject hold ttl outside the allowed range', async () => {
    const { service } = createService();

    const result = await service.holdSlot({
      slot_id: slotId,
      patient_session_id: 'session-3',
      ttl_seconds: 10,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error_code).toBe('VALIDATION_ERROR');
    }
  });

  it('should release an active hold idempotently', async () => {
    const { service, slotRepository, holdRepository } = createService();
    const hold = {
      hold_id: holdId,
      slot_id: slotId,
      status: SlotHoldStatus.ACTIVE,
    };
    holdRepository.findOne.mockResolvedValue(hold);
    slotRepository.findOne.mockResolvedValue({
      slot_id: slotId,
      status: SlotStatus.HELD,
    });

    const first = await service.releaseHold({ hold_id: holdId });
    const second = await service.releaseHold({ hold_id: holdId });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(holdRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: SlotHoldStatus.RELEASED }),
    );
    expect(slotRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        slot_id: slotId,
        status: SlotStatus.AVAILABLE,
        held_by_session_id: null,
      }),
    );
  });

  it('should queue trusted email templates only', async () => {
    const { service, emailOutboxRepository } = createService();
    emailOutboxRepository.save.mockResolvedValue({
      email_outbox_id: '80000000-0000-0000-0000-000000000001',
      status: EmailOutboxStatus.QUEUED,
    });

    const result = await service.sendEmailNotification({
      notification_type: NotificationType.BOOKING_CONFIRMATION,
      recipient_type: 'patient',
      recipient_email: 'patient@example.com',
      template_data: {
        appointment_id: appointmentId,
        patient_id: patientId,
        service_id: serviceId,
        clinic_id: clinicId,
        doctor_id: doctorId,
      },
    });

    expect(result.success).toBe(true);
    expect(emailOutboxRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_type: NotificationType.BOOKING_CONFIRMATION,
        status: EmailOutboxStatus.QUEUED,
        subject: 'Your dental appointment is confirmed',
      }),
    );
  });
});
