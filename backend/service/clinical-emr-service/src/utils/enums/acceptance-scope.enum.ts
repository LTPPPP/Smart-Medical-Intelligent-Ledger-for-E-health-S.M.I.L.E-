/**
 * How much of a treatment plan quote the patient agreed to. A 'partial'
 * acceptance sets treatment_plans.status to PARTIALLY_ACCEPTED and records the
 * detail in accepted_scope_note.
 */
export enum AcceptanceScope {
  FULL = 'full',
  PARTIAL = 'partial',
}

/** Canonical acceptance scopes — mirrors the treatment_plans.acceptance_scope width. */
export const ACCEPTANCE_SCOPE_VALUES: readonly string[] =
  Object.values(AcceptanceScope);
