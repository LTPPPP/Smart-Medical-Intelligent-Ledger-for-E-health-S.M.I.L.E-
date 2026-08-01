import { apiClient } from "@/shared/api/client";
import { ENV } from "@/shared/constants/env";

import type {
	Notification,
	NotificationListParams,
} from "../types/notification.type";

// Gateway Base Url
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
