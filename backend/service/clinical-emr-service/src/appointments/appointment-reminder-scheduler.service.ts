import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppointmentEntity } from './entities/appointment.entity';
import { AppointmentReminderPreferenceEntity } from './entities/appointment-reminder-preference.entity';
import { AppointmentNotificationLogEntity } from './entities/appointment-notification-log.entity';
import {
  AppointmentNotificationPayload,
  AppointmentNotificationPublisher,
} from './appointment-notification.publisher';
import { formatSanitizedNotificationError } from './appointment-notification-error';
import { PatientsService } from '../patients/patients.service';
import { NotificationChannel } from '../utils/enums/notification-channel.enum';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';

const DEFAULT_REMINDER_MINUTES_BEFORE = 1440;
const REMINDABLE_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
];
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class AppointmentReminderSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    AppointmentReminderSchedulerService.name,
  );
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    @InjectRepository(AppointmentEntity, 'clinicConnection')
    private readonly appointmentsRepository: Repository<AppointmentEntity>,
    @InjectRepository(AppointmentReminderPreferenceEntity, 'clinicConnection')
    private readonly reminderPreferencesRepository: Repository<AppointmentReminderPreferenceEntity>,
    @InjectRepository(AppointmentNotificationLogEntity, 'clinicConnection')
    private readonly notificationLogsRepository: Repository<AppointmentNotificationLogEntity>,
    private readonly notificationPublisher: AppointmentNotificationPublisher,
    private readonly patientsService: PatientsService,
  ) {}

  onModuleInit(): void {
    if (!this.isEnabled()) {
      return;
    }

    const intervalMs = this.getNumberEnv(
      'APPOINTMENT_REMINDER_INTERVAL_MS',
      60000,
    );
    this.timer = setInterval(() => {
      void this.processDueOnce();
    }, intervalMs);
    this.timer.unref?.();
    void this.processDueOnce();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async processDueOnce(): Promise<void> {
    if (!this.isEnabled() || this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const batchSize = this.getNumberEnv(
        'APPOINTMENT_REMINDER_BATCH_SIZE',
        20,
      );
      const { appointments, dbNow } = await this.findCandidates(batchSize);

      for (const appointment of appointments) {
        try {
          await this.processAppointment(appointment, dbNow);
        } catch (error) {
          // One appointment must never kill the batch.
          this.logger.error(
            `operation=reminder_scheduler outcome=item_failed ${formatSanitizedNotificationError(error)}`,
          );
        }
      }
    } catch (error) {
      // A failed tick must never crash the service (setInterval callbacks
      // reject unhandled otherwise).
      this.logger.error(
        `operation=reminder_scheduler outcome=tick_failed ${formatSanitizedNotificationError(error)}`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Candidates: upcoming appointments whose start falls inside the widest
   * possible reminder lead window, anchored to the database clock (the
   * date/time columns are timezone-naive, so the app clock is never used).
   */
  private async findCandidates(
    batchSize: number,
  ): Promise<{ appointments: AppointmentEntity[]; dbNow: Date }> {
    const maxLead = await this.findWidestLeadMinutes();

    const { entities, raw } = await this.appointmentsRepository
      .createQueryBuilder('a')
      // Narrow projection: the scheduler only needs identity + start time, and
      // selecting the whole entity breaks when the live schema trails the
      // entity definition (e.g. cancellation_requested).
      .select([
        'a.appointment_id',
        'a.appointment_code',
        'a.patient_id',
        'a.appointment_date',
        'a.appointment_time',
        'a.status',
      ])
      .addSelect('now()', 'db_now')
      .where('a.status IN (:...statuses)', { statuses: REMINDABLE_STATUSES })
      .andWhere(`(a.appointment_date + a.appointment_time) > now()`)
      .andWhere(
        `(a.appointment_date + a.appointment_time) <= now() + (:maxLead * interval '1 minute')`,
        { maxLead },
      )
      .orderBy('a.appointment_date', 'ASC')
      .addOrderBy('a.appointment_time', 'ASC')
      .take(batchSize)
      .getRawAndEntities();

    const dbNow = raw.length > 0 ? new Date(raw[0].db_now) : new Date();
    return { appointments: entities, dbNow };
  }

  private async findWidestLeadMinutes(): Promise<number> {
    const result: { max_lead: string | number | null } | undefined =
      await this.reminderPreferencesRepository
        .createQueryBuilder('p')
        .select('MAX(p.reminder_minutes_before)', 'max_lead')
        .where('p.enabled = TRUE')
        .getRawOne();

    const maxLead = Number(result?.max_lead ?? 0);
    return Math.max(
      Number.isFinite(maxLead) ? maxLead : 0,
      DEFAULT_REMINDER_MINUTES_BEFORE,
    );
  }

  private async processAppointment(
    appointment: AppointmentEntity,
    dbNow: Date,
  ): Promise<void> {
    const scheduledFor = this.composeStartTimestamp(appointment);
    if (!scheduledFor) {
      return;
    }

    const preferences = await this.reminderPreferencesRepository.find({
      where: {
        patient_id: appointment.patient_id,
        channel: In([
          NotificationChannel.APP,
          NotificationChannel.EMAIL,
          NotificationChannel.SMS,
        ]),
      },
    });
    const channelPlan = this.buildChannelPlan(preferences);

    let payload: AppointmentNotificationPayload | null = null;
    for (const { channel, minutesBefore } of channelPlan) {
      const dueAt = new Date(scheduledFor.getTime() - minutesBefore * 60000);
      if (dbNow < dueAt) {
        continue;
      }

      const claimed = await this.claimReminder(
        appointment,
        channel,
        scheduledFor,
        minutesBefore,
      );
      if (!claimed) {
        continue;
      }

      try {
        payload = payload ?? (await this.buildReminderPayload(appointment));
        if (!payload) {
          await this.notificationLogsRepository.update(
            { log_id: claimed.log_id },
            {
              status: 'skipped',
              attempt_count: 0,
              last_attempt_at: null,
            },
          );
          continue;
        }

        const result = await this.notificationPublisher.sendAppointmentReminder(
          payload,
          channel,
        );
        await this.notificationLogsRepository.update(
          { log_id: claimed.log_id },
          {
            status: 'sent',
            notification_id: result?.notificationId ?? null,
          },
        );
        this.logger.log(
          `operation=reminder_scheduler outcome=sent channel=${channel}`,
        );
      } catch (error) {
        await this.notificationLogsRepository.update(
          { log_id: claimed.log_id },
          {
            status: 'failed',
            error_message: formatSanitizedNotificationError(error),
            next_retry_at: new Date(Date.now() + 15 * 60 * 1000),
          },
        );
        this.logger.warn(
          `operation=reminder_scheduler outcome=failed channel=${channel} ${formatSanitizedNotificationError(error)}`,
        );
      }
    }
  }

  /**
   * APP is always planned (unless the patient explicitly disabled its row);
   * EMAIL/SMS require an enabled preference row. PUSH rows are ignored — the
   * in-app notification covers on-device delivery.
   */
  private buildChannelPlan(
    preferences: AppointmentReminderPreferenceEntity[],
  ): Array<{ channel: NotificationChannel; minutesBefore: number }> {
    const byChannel = new Map(
      preferences.map((preference) => [preference.channel, preference]),
    );
    const plan: Array<{
      channel: NotificationChannel;
      minutesBefore: number;
    }> = [];

    const appPreference = byChannel.get(NotificationChannel.APP);
    if (!appPreference || appPreference.enabled) {
      plan.push({
        channel: NotificationChannel.APP,
        minutesBefore:
          appPreference?.reminder_minutes_before ??
          DEFAULT_REMINDER_MINUTES_BEFORE,
      });
    }

    for (const channel of [
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
    ]) {
      const preference = byChannel.get(channel);
      if (preference?.enabled) {
        plan.push({
          channel,
          minutesBefore:
            preference.reminder_minutes_before ??
            DEFAULT_REMINDER_MINUTES_BEFORE,
        });
      }
    }

    return plan;
  }

  /**
   * Claim by inserting the log row protected by the partial unique index
   * uq_reminder_logs_dedupe — a 23505 means another replica (or a previous
   * tick) already owns this (appointment, channel, scheduled_for) window.
   */
  private async claimReminder(
    appointment: AppointmentEntity,
    channel: NotificationChannel,
    scheduledFor: Date,
    minutesBefore: number,
  ): Promise<AppointmentNotificationLogEntity | null> {
    const log = this.notificationLogsRepository.create({
      appointment_id: appointment.appointment_id,
      notification_type: 'APPOINTMENT_REMINDER',
      channel,
      status: 'processing',
      scheduled_for: scheduledFor,
      preference_enabled: true,
      reminder_minutes_before: minutesBefore,
      attempt_count: 1,
      last_attempt_at: new Date(),
    });

    try {
      return await this.notificationLogsRepository.save(log);
    } catch (error) {
      if (
        (error as { code?: string; driverError?: { code?: string } })?.code ===
          PG_UNIQUE_VIOLATION ||
        (error as { driverError?: { code?: string } })?.driverError?.code ===
          PG_UNIQUE_VIOLATION
      ) {
        return null;
      }
      throw error;
    }
  }

  private async buildReminderPayload(
    appointment: AppointmentEntity,
  ): Promise<AppointmentNotificationPayload | null> {
    let userId: string | null = null;
    try {
      const patient = await this.patientsService.findOne(
        appointment.patient_id,
      );
      userId = patient?.user_id ?? null;
    } catch {
      userId = null;
    }
    if (!userId) {
      this.logger.warn(
        'operation=reminder_scheduler outcome=skipped reason=missing_patient_user',
      );
      return null;
    }

    const basePayload = this.notificationPublisher.buildPayload(
      appointment,
      'APPOINTMENT_REMINDER',
    );
    return { ...basePayload, recipientId: userId };
  }

  private composeStartTimestamp(appointment: AppointmentEntity): Date | null {
    const date =
      appointment.appointment_date instanceof Date
        ? appointment.appointment_date.toISOString().split('T')[0]
        : appointment.appointment_date;
    if (!date || !appointment.appointment_time) {
      return null;
    }
    const composed = new Date(`${date}T${appointment.appointment_time}`);
    return Number.isNaN(composed.getTime()) ? null : composed;
  }

  private isEnabled(): boolean {
    return process.env.APPOINTMENT_REMINDER_ENABLED === 'true';
  }

  private getNumberEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) {
      return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
