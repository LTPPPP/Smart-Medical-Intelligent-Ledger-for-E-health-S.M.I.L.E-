// Plan Status Lifecycle
export enum PlanStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PROPOSED = 'proposed',
  ACCEPTED = 'accepted',
  PARTIALLY_ACCEPTED = 'partially_accepted',
  DECLINED = 'declined',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Canonical Values
export const PLAN_STATUS_VALUES: readonly string[] = Object.values(PlanStatus);
