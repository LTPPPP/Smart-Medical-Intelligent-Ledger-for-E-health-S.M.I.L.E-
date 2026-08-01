// Notification Shape

// Notification Channel
export type NotificationChannel = "APP" | "EMAIL" | "SMS" | "PUSH";

// Notification Status
export type NotificationStatus =
	| "pending"
	| "sent"
	| "failed"
	| "read"
	| "cancelled";

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
