// Notification shape returned by the IAM notifications module
// (backend/service/iam-service/src/notifications/domain/notification.ts).
// Read state is derived from `readAt` / `status` — there is no `isRead` boolean.

/** Mirrors the backend NotificationChannel enum; the in-app channel is 'APP'. */
export type NotificationChannel = 'APP' | 'EMAIL' | 'SMS' | 'PUSH';

export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export interface Notification {
  notificationId: string;
  recipientId: string;
  templateId?: string;
  notificationType?: string;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  scheduledAt: string;
  sentAt?: string;
  readAt?: string;
  status: NotificationStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
}
