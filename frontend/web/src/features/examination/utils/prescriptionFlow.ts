export type PrescriptionWorkflowStatus = 'draft' | 'issued' | 'cancelled' | string;

export function normalizePrescriptionStatus(
  status?: string | null,
): PrescriptionWorkflowStatus {
  return status?.trim().toLowerCase() || 'draft';
}

export function canCreatePrescription({
  isFinalized,
  patientId,
}: {
  isFinalized: boolean;
  patientId?: string | null;
}): boolean {
  return !isFinalized && Boolean(patientId?.trim());
}

export function canModifyPrescriptionItems({
  isFinalized,
  prescriptionId,
  status,
}: {
  isFinalized: boolean;
  prescriptionId?: string | null;
  status?: string | null;
}): boolean {
  return (
    !isFinalized &&
    Boolean(prescriptionId?.trim()) &&
    normalizePrescriptionStatus(status) === 'draft'
  );
}
