export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  APP = 'APP',
}

// Canonical Values
export const NOTIFICATION_CHANNEL_VALUES: readonly string[] =
  Object.values(NotificationChannel);
