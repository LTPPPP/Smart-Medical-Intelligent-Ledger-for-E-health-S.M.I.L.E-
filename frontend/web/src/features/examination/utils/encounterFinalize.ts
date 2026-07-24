interface FinalizeEncounterInput {
  status?: string | null;
  clinicalNotes: Array<string | null | undefined>;
  diagnosisCount: number;
}

export function getFinalizeEncounterBlocker({
  status,
  clinicalNotes,
  diagnosisCount,
}: FinalizeEncounterInput): string | null {
  const normalizedStatus = (status ?? '').toLowerCase();
  if (normalizedStatus !== 'in_progress') {
    return 'Only in-progress encounters can be finalized.';
  }

  const hasClinicalNote = clinicalNotes.some(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );
  if (!hasClinicalNote) {
    return 'Add a clinical note before finalizing.';
  }

  if (diagnosisCount < 1) {
    return 'Add at least one diagnosis before finalizing.';
  }

  return null;
}
