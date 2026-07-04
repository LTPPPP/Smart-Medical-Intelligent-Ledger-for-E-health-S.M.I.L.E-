import type {
  MedicationRoute,
  Prescription,
  PrescriptionStatus,
  PrescriptionItem,
} from "../types/examination.type";

export type PrescriptionWorkflowStatus =
  "draft" | "issued" | "cancelled" | string;

export interface BackendPrescriptionItem {
  item_id?: string | null;
  medication_name?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  duration_days?: number | null;
  route?: string | null;
  quantity?: number | null;
  instructions?: string | null;
}

export interface BackendPrescription {
  prescription_id?: string | null;
  session_id?: string | null;
  patient_id?: string | null;
  doctor_id?: string | null;
  status?: string | null;
  notes?: string | null;
  digital_signature_id?: string | null;
  issued_at?: string | null;
  issued_by?: string | null;
  minor_patient_at_issue?: boolean | null;
  patient_age_years_at_issue?: number | null;
  patient_age_months_at_issue?: number | null;
  representative_name_snapshot?: string | null;
  representative_phone_snapshot?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  items?: BackendPrescriptionItem[] | null;
}

export interface BackendPrescriptionItemPayload {
  prescription_id: string;
  medication_name: string;
  dosage: string;
  route: string;
  frequency: string;
  duration_days: number;
  quantity: number;
  instructions: string;
}

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

export function mapBackendPrescription(
  prescription: BackendPrescription | null | undefined,
): Prescription | null {
  if (!prescription) return null;

  const prescriptionId = prescription.prescription_id ?? "";

  return {
    id: prescriptionId,
    sessionId: prescription.session_id ?? "",
    patientId: prescription.patient_id ?? "",
    doctorId: prescription.doctor_id ?? "",
    prescriptionCode: prescriptionId,
    status: normalizePrescriptionUiStatus(prescription.status),
    notes: prescription.notes ?? undefined,
    digitalSignature: prescription.digital_signature_id ?? undefined,
    dispensedAt: prescription.issued_at ?? undefined,
    dispensedBy: prescription.issued_by ?? undefined,
    minorPatientAtIssue: prescription.minor_patient_at_issue ?? null,
    patientAgeYearsAtIssue: prescription.patient_age_years_at_issue ?? null,
    patientAgeMonthsAtIssue: prescription.patient_age_months_at_issue ?? null,
    representativeNameSnapshot:
      prescription.representative_name_snapshot ?? null,
    representativePhoneSnapshot:
      prescription.representative_phone_snapshot ?? null,
    createdAt: prescription.created_at ?? "",
    updatedAt: prescription.updated_at ?? "",
    items: (prescription.items ?? []).map(mapBackendPrescriptionItem),
  };
}

export function formatPediatricPrescriptionSnapshot(
  prescription:
    | Pick<
        Prescription,
        | "minorPatientAtIssue"
        | "patientAgeYearsAtIssue"
        | "patientAgeMonthsAtIssue"
        | "representativeNameSnapshot"
        | "representativePhoneSnapshot"
      >
    | null
    | undefined,
): string | null {
  if (prescription?.minorPatientAtIssue !== true) {
    return null;
  }

  const ageYears = prescription.patientAgeYearsAtIssue;
  const ageMonths = prescription.patientAgeMonthsAtIssue;
  const age =
    ageYears != null && ageMonths != null
      ? `${ageYears} years old / ${ageMonths} months`
      : "age not recorded";
  const representative = [
    prescription.representativeNameSnapshot,
    prescription.representativePhoneSnapshot
      ? `(${prescription.representativePhoneSnapshot})`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return `Minor patient: ${age}. Representative: ${representative || "not recorded"}.`;
}

export function toPrescriptionItemPayload(
  prescriptionId: string,
  item: Omit<PrescriptionItem, "id">,
): BackendPrescriptionItemPayload {
  return {
    prescription_id: prescriptionId,
    medication_name: item.medicationName.trim(),
    dosage: item.dosage.trim(),
    route: item.route,
    frequency: item.frequency.trim(),
    duration_days: parseDurationDays(item.duration),
    quantity: item.quantity,
    instructions: item.instructions?.trim() ?? "",
  };
}

function mapBackendPrescriptionItem(
  item: BackendPrescriptionItem,
): PrescriptionItem {
  return {
    id: item.item_id ?? undefined,
    medicationName: item.medication_name ?? "",
    dosage: item.dosage ?? "",
    frequency: item.frequency ?? "",
    duration:
      item.duration_days && item.duration_days > 0
        ? `${item.duration_days} days`
        : "",
    route: normalizeMedicationRoute(item.route),
    quantity: item.quantity ?? 0,
    instructions: item.instructions ?? undefined,
  };
}

function normalizeMedicationRoute(route?: string | null): MedicationRoute {
  const normalized = route?.trim().toUpperCase();
  if (
    normalized === "ORAL" ||
    normalized === "TOPICAL" ||
    normalized === "INJECTION" ||
    normalized === "INHALATION" ||
    normalized === "OTHER"
  ) {
    return normalized;
  }
  return "OTHER";
}

function normalizePrescriptionUiStatus(
  status?: string | null,
): PrescriptionStatus {
  const normalized = normalizePrescriptionStatus(status);
  switch (normalized) {
    case "issued":
      return "ISSUED";
    case "active":
      return "ACTIVE";
    case "dispensed":
      return "DISPENSED";
    case "cancelled":
      return "CANCELLED";
    case "expired":
      return "EXPIRED";
    case "draft":
    default:
      return "DRAFT";
  }
}

function parseDurationDays(duration: string): number {
  const match = duration.match(/\d+/);
  const value = match ? Number(match[0]) : 0;
  return Number.isInteger(value) && value > 0 ? value : 0;
}
