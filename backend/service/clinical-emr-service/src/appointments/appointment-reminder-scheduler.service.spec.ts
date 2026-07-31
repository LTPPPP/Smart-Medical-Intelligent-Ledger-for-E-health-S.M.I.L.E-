import { AppointmentReminderSchedulerService } from './appointment-reminder-scheduler.service';
import { NotificationChannel } from '../utils/enums/notification-channel.enum';

const APPOINTMENT_ID = 'a0000000-0000-0000-0000-000000000001';
const PATIENT_ID = 'p0000000-0000-0000-0000-000000000001';
const USER_ID = 'u0000000-0000-0000-0000-000000000001';

function buildAppointment(overrides: Record<string, unknown> = {}) {
  return {
    appointment_id: APPOINTMENT_ID,
    appointment_code: 'APT-20260731-ABCD',
    patient_id: PATIENT_ID,
    appointment_date: '2026-07-31',
    appointment_time: '09:00:00',
    status: 'confirmed',
    ...overrides,
  };
}

function createService(
  overrides: {
    appointments?: unknown[];
    dbNow?: string;
    preferences?: unknown[];
    patient?: unknown;
  } = {},
) {
  const appointments = overrides.appointments ?? [buildAppointment()];
  const dbNow = overrides.dbNow ?? '2026-07-30T10:00:00';

  const appointmentsQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn().mockResolvedValue({
      entities: appointments,
      raw: appointments.map(() => ({ db_now: dbNow })),
    }),
  };
  const appointmentsRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(appointmentsQueryBuilder),
  };

  const preferencesQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ max_lead: null }),
  };
  const reminderPreferencesRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(preferencesQueryBuilder),
    find: jest.fn().mockResolvedValue(overrides.preferences ?? []),
  };

  const notificationLogsRepository = {
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve({ ...value, log_id: 'log-1' })),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const notificationPublisher = {
    buildPayload: jest.fn((appointment: any, notificationType: string) => ({
      appointmentId: appointment.appointment_id,
      appointmentCode: appointment.appointment_code,
      recipientId: appointment.patient_id,
      notificationType,
      relatedEntityType: 'appointment',
      relatedEntityId: appointment.appointment_id,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      title: 'Appointment reminder',
      message: 'reminder message',
    })),
    sendAppointmentReminder: jest
      .fn()
      .mockResolvedValue({ notificationId: 'n-1' }),
  };

  const patientsService = {
    findOne: jest
      .fn()
      .mockResolvedValue(
        'patient' in overrides ? overrides.patient : { user_id: USER_ID },
      ),
  };

  const service = new AppointmentReminderSchedulerService(
    appointmentsRepository as any,
    reminderPreferencesRepository as any,
    notificationLogsRepository as any,
    notificationPublisher as any,
    patientsService as any,
  );

  return {
    service,
    appointmentsRepository,
    reminderPreferencesRepository,
    notificationLogsRepository,
    notificationPublisher,
    patientsService,
  };
}

describe('AppointmentReminderSchedulerService', () => {
  const originalEnabled = process.env.APPOINTMENT_REMINDER_ENABLED;

  beforeEach(() => {
    process.env.APPOINTMENT_REMINDER_ENABLED = 'true';
  });

  afterEach(() => {
    if (originalEnabled === undefined) {
      delete process.env.APPOINTMENT_REMINDER_ENABLED;
    } else {
      process.env.APPOINTMENT_REMINDER_ENABLED = originalEnabled;
    }
    jest.restoreAllMocks();
  });

  it('should do nothing when the scheduler is disabled', async () => {
    process.env.APPOINTMENT_REMINDER_ENABLED = 'false';
    const { service, appointmentsRepository } = createService();

    await service.processDueOnce();

    expect(appointmentsRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('should send a default APP reminder inside the 24h window', async () => {
    const { service, notificationPublisher, notificationLogsRepository } =
      createService();

    await service.processDueOnce();

    expect(notificationPublisher.sendAppointmentReminder).toHaveBeenCalledTimes(
      1,
    );
    const [payload, channel] =
      notificationPublisher.sendAppointmentReminder.mock.calls[0];
    expect(channel).toBe(NotificationChannel.APP);
    expect(payload.recipientId).toBe(USER_ID);
    expect(notificationLogsRepository.update).toHaveBeenCalledWith(
      { log_id: 'log-1' },
      expect.objectContaining({ status: 'sent', notification_id: 'n-1' }),
    );
  });

  it('should also send EMAIL when the patient enabled that preference', async () => {
    const { service, notificationPublisher } = createService({
      preferences: [
        {
          patient_id: PATIENT_ID,
          channel: NotificationChannel.EMAIL,
          enabled: true,
          reminder_minutes_before: 1440,
        },
      ],
    });

    await service.processDueOnce();

    const channels =
      notificationPublisher.sendAppointmentReminder.mock.calls.map(
        ([, channel]: [unknown, NotificationChannel]) => channel,
      );
    expect(channels).toEqual([
      NotificationChannel.APP,
      NotificationChannel.EMAIL,
    ]);
  });

  it('should not send SMS when the preference row is disabled', async () => {
    const { service, notificationPublisher } = createService({
      preferences: [
        {
          patient_id: PATIENT_ID,
          channel: NotificationChannel.SMS,
          enabled: false,
          reminder_minutes_before: 1440,
        },
      ],
    });

    await service.processDueOnce();

    const channels =
      notificationPublisher.sendAppointmentReminder.mock.calls.map(
        ([, channel]: [unknown, NotificationChannel]) => channel,
      );
    expect(channels).toEqual([NotificationChannel.APP]);
  });

  it('should skip appointments not yet inside their reminder window', async () => {
    const { service, notificationPublisher } = createService({
      appointments: [
        buildAppointment({
          appointment_date: '2026-08-05',
          appointment_time: '09:00:00',
        }),
      ],
    });

    await service.processDueOnce();

    expect(
      notificationPublisher.sendAppointmentReminder,
    ).not.toHaveBeenCalled();
  });

  it('should skip a channel already claimed by another replica (23505)', async () => {
    const { service, notificationPublisher, notificationLogsRepository } =
      createService();
    notificationLogsRepository.save.mockRejectedValue(
      Object.assign(new Error('duplicate key'), { code: '23505' }),
    );

    await service.processDueOnce();

    expect(
      notificationPublisher.sendAppointmentReminder,
    ).not.toHaveBeenCalled();
  });

  it('should mark the log failed with a retry time when publishing fails', async () => {
    const { service, notificationPublisher, notificationLogsRepository } =
      createService();
    notificationPublisher.sendAppointmentReminder.mockRejectedValue(
      Object.assign(new Error('sentinel-raw-error'), { name: 'FetchError' }),
    );

    await service.processDueOnce();

    expect(notificationLogsRepository.update).toHaveBeenCalledWith(
      { log_id: 'log-1' },
      expect.objectContaining({
        status: 'failed',
        next_retry_at: expect.any(Date),
      }),
    );
    const updateArg = notificationLogsRepository.update.mock.calls[0][1];
    expect(String(updateArg.error_message)).not.toContain('sentinel-raw-error');
  });

  it('should skip without throwing when the patient has no linked user', async () => {
    const { service, notificationPublisher, notificationLogsRepository } =
      createService({ patient: { user_id: null } });

    await expect(service.processDueOnce()).resolves.toBeUndefined();
    expect(
      notificationPublisher.sendAppointmentReminder,
    ).not.toHaveBeenCalled();
    expect(notificationLogsRepository.update).toHaveBeenCalledWith(
      { log_id: 'log-1' },
      expect.objectContaining({ status: 'skipped' }),
    );
  });
});
