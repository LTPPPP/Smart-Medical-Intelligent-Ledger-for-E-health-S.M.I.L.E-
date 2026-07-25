export interface ExaminationSession {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  status: ExaminationStatus;
  startTime: string;
  endTime?: string;
  chiefComplaint: string;
  vitalSigns?: VitalSigns;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * examination_sessions.status. No backend enum pins this column, so these are the
 * values the API actually writes: 'in_progress' is the column default.
 */
export type ExaminationStatus = 'draft' | 'in_progress' | 'completed';

export interface VitalSigns {
  bloodPressure?: string;
  pulse?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  [key: string]: unknown; // For additional JSONB fields
}

// Diagnosis Types
export interface Diagnosis {
  id: string;
  sessionId: string;
  icdCode: string;
  description: string;
  affectedTeeth?: number[];
  severity: DiagnosisSeverity;
  recommendedTreatment?: string;
  aiSuggested?: boolean;
  aiConfidence?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors the backend Severity enum (lowercase on the wire). */
export type DiagnosisSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

// Prescription Types
export interface Prescription {
  id: string;
  sessionId: string;
  patientId: string;
  doctorId: string;
  prescriptionCode: string;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  notes?: string;
  digitalSignature?: string;
  dispensedAt?: string;
  dispensedBy?: string;
  minorPatientAtIssue?: boolean | null;
  patientAgeYearsAtIssue?: number | null;
  patientAgeMonthsAtIssue?: number | null;
  representativeNameSnapshot?: string | null;
  representativePhoneSnapshot?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors the backend PrescriptionStatus enum, uppercased for display. */
export type PrescriptionStatus = 'DRAFT' | 'ISSUED' | 'DISPENSED' | 'CANCELLED';

export interface PrescriptionItem {
  id?: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: MedicationRoute;
  quantity: number;
  instructions?: string;
  warnings?: string;
}

export type MedicationRoute =
  | 'ORAL'
  | 'TOPICAL'
  | 'INJECTION'
  | 'INHALATION'
  | 'OTHER';

// Treatment Plan Types
export interface TreatmentPlan {
  id?: string;
  plan_id?: string;
  sessionId?: string;
  session_id?: string;
  patientId?: string;
  patient_id?: string;
  record_id?: string | null;
  diagnosisId?: string;
  status: TreatmentPlanStatus;
  title?: string;
  plan_name?: string | null;
  objectives?: string | null;
  duration_weeks?: number | null;
  steps?: TreatmentStep[];
  totalEstimatedCost?: number;
  estimated_cost?: string | number | null;
  quote_currency?: string | null;
  quote_version?: string | null;
  risk_disclosure?: string | null;
  alternative_options?: string | null;
  proposed_at?: string | null;
  approvedAt?: string;
  approvedBy?: string;
  accepted_at?: string | null;
  accepted_by?: string | null;
  declined_at?: string | null;
  declined_by?: string | null;
  decline_reason?: string | null;
  acceptance_scope?: string | null;
  accepted_scope_note?: string | null;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors the backend PlanStatus enum. */
export type TreatmentPlanStatus =
  | 'draft'
  | 'sent'
  | 'proposed'
  | 'accepted'
  | 'partially_accepted'
  | 'declined'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface TreatmentStep {
  stepNumber: number;
  description: string;
  estimatedDate?: string;
  status: TreatmentStepStatus;
  estimatedCost: number;
  actualCost?: number;
  completedAt?: string;
  notes?: string;
}

export type TreatmentStepStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED';

// Imaging Order Types
export interface ImagingOrder {
  id: string;
  sessionId: string;
  patientId: string;
  doctorId: string;
  orderCode: string;
  imagingType: ImagingType;
  urgency: OrderUrgency;
  status: OrderStatus;
  clinicalIndication: string;
  affectedTeeth?: number[];
  scheduledAt?: string;
  completedAt?: string;
  radiologistId?: string;
  findings?: string;
  createdAt: string;
  updatedAt: string;
}

export type ImagingType =
  | 'PERIAPICAL'
  | 'BITEWING'
  | 'PANORAMIC'
  | 'CEPHALOMETRIC'
  | 'CBCT'
  | 'OCCLUSAL';

/** Mirrors the backend OrderPriority enum (lowercase on the wire). */
export type OrderUrgency = 'routine' | 'urgent' | 'stat';

/** Mirrors the backend OrderStatus enum. */
export type OrderStatus = 'ordered' | 'in_progress' | 'completed' | 'cancelled';

// Lab Order Types
export interface LabOrder {
  id: string;
  sessionId: string;
  patientId: string;
  doctorId: string;
  orderCode: string;
  labTestType: LabTestType;
  urgency: OrderUrgency;
  status: OrderStatus;
  clinicalIndication: string;
  scheduledAt?: string;
  completedAt?: string;
  laboratoryId?: string;
  results?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type LabTestType =
  | 'BIOPSY'
  | 'CULTURE'
  | 'BLOOD_TEST'
  | 'ALLERGY_TEST'
  | 'OTHER';

// Request Types
export interface CreateExaminationSessionRequest {
  appointmentId: string;
  patientId?: string;
  doctorId?: string;
  clinicId?: string;
  chiefComplaint?: string;
  vitalSigns?: VitalSigns;
  notes?: string;
}

export interface UpdateExaminationSessionRequest {
  status?: ExaminationStatus;
  chiefComplaint?: string;
  vitalSigns?: VitalSigns;
  notes?: string;
  endTime?: string;
}

export interface CreateDiagnosisRequest {
  sessionId: string;
  icdCode: string;
  description: string;
  affectedTeeth?: number[];
  severity: DiagnosisSeverity;
  recommendedTreatment?: string;
  notes?: string;
}

export interface UpdateDiagnosisRequest {
  icdCode?: string;
  description?: string;
  affectedTeeth?: number[];
  severity?: DiagnosisSeverity;
  recommendedTreatment?: string;
  notes?: string;
}

export interface CreatePrescriptionRequest {
  sessionId: string;
  patientId: string;
  items: Omit<PrescriptionItem, 'id'>[];
  notes?: string;
}

export interface UpdatePrescriptionRequest {
  items?: Omit<PrescriptionItem, 'id'>[];
  notes?: string;
  status?: PrescriptionStatus;
}

export interface CreateTreatmentPlanRequest {
  sessionId?: string;
  session_id?: string;
  patientId?: string;
  patient_id?: string;
  record_id?: string;
  diagnosisId?: string;
  title?: string;
  plan_name?: string;
  objectives?: string;
  duration_weeks?: number;
  estimated_cost?: string | number;
  quote_currency?: string;
  quote_version?: string;
  risk_disclosure?: string;
  alternative_options?: string;
  created_by?: string;
  steps?: Omit<TreatmentStep, 'status' | 'completedAt' | 'actualCost'>[];
}

export interface UpdateTreatmentPlanRequest {
  title?: string;
  plan_name?: string;
  objectives?: string;
  duration_weeks?: number;
  estimated_cost?: string | number;
  quote_currency?: string;
  quote_version?: string;
  risk_disclosure?: string;
  alternative_options?: string;
  steps?: TreatmentStep[];
  status?: TreatmentPlanStatus;
}

export interface CreateImagingOrderRequest {
  sessionId: string;
  patientId: string;
  imagingType: ImagingType;
  urgency: OrderUrgency;
  clinicalIndication: string;
  affectedTeeth?: number[];
}

export interface UpdateImagingOrderRequest {
  status?: OrderStatus;
  scheduledAt?: string;
  findings?: string;
  radiologistId?: string;
}

export interface CreateLabOrderRequest {
  sessionId: string;
  patientId: string;
  labTestType: LabTestType;
  urgency: OrderUrgency;
  clinicalIndication: string;
}

export interface UpdateLabOrderRequest {
  status?: OrderStatus;
  scheduledAt?: string;
  results?: Record<string, unknown>;
  laboratoryId?: string;
}

// Query Params
export interface ExaminationListParams {
  page?: number;
  size?: number;
  status?: ExaminationStatus;
  startDate?: string;
  endDate?: string;
  sort?: string[];
}

export interface DiagnosisListParams {
  page?: number;
  size?: number;
  icdCode?: string;
  severity?: DiagnosisSeverity;
  sort?: string[];
}

export interface PrescriptionListParams {
  page?: number;
  size?: number;
  status?: PrescriptionStatus;
  startDate?: string;
  endDate?: string;
  sort?: string[];
}

export interface OrderListParams {
  page?: number;
  size?: number;
  status?: OrderStatus;
  urgency?: OrderUrgency;
  sort?: string[];
}
