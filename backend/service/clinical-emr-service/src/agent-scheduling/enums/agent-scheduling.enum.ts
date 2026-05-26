export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  HELD = 'HELD',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
}

export enum SlotHoldStatus {
  ACTIVE = 'ACTIVE',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
  CONFIRMED = 'CONFIRMED',
}

export enum WaitlistEntryStatus {
  ACTIVE = 'ACTIVE',
  NOTIFIED = 'NOTIFIED',
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum EmailOutboxStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum HandoffTicketStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationType {
  BOOKING_CONFIRMATION = 'booking_confirmation',
  BOOKING_REMINDER = 'booking_reminder',
  CANCELLATION_CONFIRMATION = 'cancellation_confirmation',
  RESCHEDULE_CONFIRMATION = 'reschedule_confirmation',
  WAITLIST_SLOT_AVAILABLE = 'waitlist_slot_available',
  HANDOFF_ALERT = 'handoff_alert',
  MANUAL_REVIEW_REQUIRED = 'manual_review_required',
}
