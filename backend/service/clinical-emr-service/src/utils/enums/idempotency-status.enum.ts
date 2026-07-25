/**
 * State of a stored idempotency key. A request is recorded as IN_PROGRESS before
 * it runs and flipped to COMPLETED once its response is cached, so a replay
 * arriving mid-flight can be told apart from one arriving after completion.
 */
export enum IdempotencyStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/** Canonical idempotency statuses — mirrors the idempotency_keys.status width. */
export const IDEMPOTENCY_STATUS_VALUES: readonly string[] =
  Object.values(IdempotencyStatus);
