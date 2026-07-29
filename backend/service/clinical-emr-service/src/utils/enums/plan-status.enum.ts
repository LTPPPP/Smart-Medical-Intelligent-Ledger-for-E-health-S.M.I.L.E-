/**
 * Treatment plan lifecycle.
 *
 * draft -> proposed -> accepted | partially_accepted | declined, and separately
 * in_progress -> completed once work starts. PARTIALLY_ACCEPTED is set when the
 * patient accepts only part of the quote (acceptance_scope = 'partial').
 *
 * PARTIALLY_ACCEPTED is the longest value at 18 characters, which is what sizes
 * treatment_plans.status.
 */
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

/** Canonical plan statuses — mirrors the treatment_plans.status width. */
export const PLAN_STATUS_VALUES: readonly string[] = Object.values(PlanStatus);
