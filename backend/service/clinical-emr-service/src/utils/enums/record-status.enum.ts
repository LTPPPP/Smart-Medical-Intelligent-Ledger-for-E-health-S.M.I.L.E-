/**
 * Lifecycle of a medical record. Once finalized the record is immutable and its
 * record_hash is fixed; amendments go through examination_session_amendments.
 */
export enum RecordStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
}

/** Canonical record statuses — mirrors the medical_records.record_status width. */
export const RECORD_STATUS_VALUES: readonly string[] =
  Object.values(RecordStatus);
