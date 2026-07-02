export type PrescriptionWorkflowStatus =
  "draft" | "issued" | "cancelled" | string;

export function normalizePrescriptionStatus(
  status?: string | null,
): PrescriptionWorkflowStatus {
  return status?.trim().toLowerCase() || "draft";
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
    normalizePrescriptionStatus(status) === "draft"
  );
}

export function canIssuePrescription({
  isFinalized,
  prescriptionId,
  status,
  itemCount,
}: {
  isFinalized: boolean;
  prescriptionId?: string | null;
  status?: string | null;
  itemCount: number;
}): boolean {
  return (
    !isFinalized &&
    Boolean(prescriptionId?.trim()) &&
    normalizePrescriptionStatus(status) === "draft" &&
    itemCount > 0
  );
}

export function validatePrescriptionItemForm({
  medication_name,
  dosage,
  route,
  frequency,
  duration_days,
  quantity,
  instructions,
}: {
  medication_name: string;
  dosage: string;
  route?: string | null;
  frequency: string;
  duration_days?: number | null;
  quantity?: number | null;
  instructions?: string | null;
}): string | null {
  if (!medication_name.trim() || !dosage.trim() || !frequency.trim()) {
    return "Medication name, dosage and frequency are required.";
  }
  if (!route?.trim()) {
    return "Route is required.";
  }
  if (duration_days == null) {
    return "Duration is required.";
  }
  if (!Number.isInteger(duration_days) || duration_days <= 0) {
    return "Duration must be a positive whole number.";
  }
  if (quantity == null) {
    return "Quantity is required.";
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return "Quantity must be a positive whole number.";
  }
  if (!instructions?.trim()) {
    return "Instructions are required.";
  }
  return null;
}
