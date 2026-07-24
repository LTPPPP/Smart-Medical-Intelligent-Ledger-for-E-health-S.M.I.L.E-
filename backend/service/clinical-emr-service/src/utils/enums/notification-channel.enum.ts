export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  APP = 'APP',
}

/** Canonical notification channels — mirrors the chk_*_channel DB constraints. */
export const NOTIFICATION_CHANNEL_VALUES: readonly string[] =
  Object.values(NotificationChannel);
