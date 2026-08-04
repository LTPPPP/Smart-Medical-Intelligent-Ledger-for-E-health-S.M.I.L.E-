// Record Lifecycle
export enum RecordStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
}

// Canonical Values
export const RECORD_STATUS_VALUES: readonly string[] =
  Object.values(RecordStatus);
