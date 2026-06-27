import { apiClient } from '@/shared/api/client';
import { ENV } from '@/shared/constants/env';
import type {
  Notification,
  NotificationListParams,
} from '../types/notification.type';

// NOTE: `API_ENDPOINTS` has no notification constants and must not be edited,
// so notification URLs are built from the gateway base. `ENV.SERVICES.GATEWAY`
// already includes the `/api/v1` prefix, so we only append `/notifications/...`.
const NOTIFICATIONS_BASE = `${ENV.SERVICES.GATEWAY}/notifications`;

export const notificationApi = {
  getByUser: (userId: string, params?: NotificationListParams) =>
    apiClient.get<Notification[]>(`${NOTIFICATIONS_BASE}/user/${userId}`, {
      params,
    }),

  getUnreadCount: (userId: string) =>
    apiClient.get<number>(`${NOTIFICATIONS_BASE}/user/${userId}/unread-count`),

  markRead: (id: string) =>
    apiClient.post<void>(`${NOTIFICATIONS_BASE}/${id}/read`),
};
