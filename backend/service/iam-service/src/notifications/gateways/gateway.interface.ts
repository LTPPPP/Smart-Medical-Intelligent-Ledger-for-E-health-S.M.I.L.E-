export interface SendNotificationDto {
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  message: string;
}

export interface SendNotificationResult {
  id: string;
  status: 'sent' | 'created' | 'skipped';
}
