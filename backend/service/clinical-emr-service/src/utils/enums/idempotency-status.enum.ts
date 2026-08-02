// Idempotency Status
export enum IdempotencyStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

// Canonical Values
export const IDEMPOTENCY_STATUS_VALUES: readonly string[] =
  Object.values(IdempotencyStatus);
