import { GENDER_TYPE } from '@/shared/constants';

// PATIENT TYPES

export type PatientType = 'REGISTERED' | 'WALK_IN';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED';
export type BloodType =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'O+'
  | 'O-'
  | 'AB+'
  | 'AB-'
  | 'UNKNOWN';
export type RelationshipType =
  | 'SPOUSE'
  | 'PARENT'
  | 'CHILD'
  | 'SIBLING'
  | 'FRIEND'
  | 'OTHER';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: RelationshipType;
  address?: string;
}

export interface Patient {
  id: string;
  patientCode: string;
  userId?: string;
  fullName: string;
  dateOfBirth: string;
  gender: GENDER_TYPE;
  phone: string;
  email?: string;
  address?: string;
  bloodType?: BloodType;
  allergies?: string[];
  emergencyContact?: EmergencyContact;
  patientType: PatientType;
  status: PatientStatus;
  insuranceNumber?: string;
  insuranceProvider?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  userId?: string;
  fullName: string;
  dateOfBirth: string;
  gender: GENDER_TYPE;
  phone: string;
  email?: string;
  address?: string;
  bloodType?: BloodType;
  allergies?: string[];
  emergencyContact?: EmergencyContact;
  patientType?: PatientType;
  insuranceNumber?: string;
  insuranceProvider?: string;
  notes?: string;
}

export interface UpdatePatientRequest {
  fullName?: string;
  dateOfBirth?: string;
  gender?: GENDER_TYPE;
  phone?: string;
  email?: string;
  address?: string;
  bloodType?: BloodType;
  allergies?: string[];
  emergencyContact?: EmergencyContact;
  insuranceNumber?: string;
  insuranceProvider?: string;
  notes?: string;
  status?: PatientStatus;
}

export interface PatientSearchParams {
  page?: number;
  size?: number;
  keyword?: string;
  patientType?: PatientType;
  status?: PatientStatus;
  fromDate?: string;
  toDate?: string;
  sort?: string[];
}

// MEDICAL HISTORY TYPES

export type ConditionType =
  | 'ALLERGY'
  | 'CHRONIC_CONDITION'
  | 'PREVIOUS_SURGERY'
  | 'MEDICATION'
  | 'FAMILY_HISTORY';

export type ConditionSeverity = 'MILD' | 'MODERATE' | 'SEVERE';

export interface MedicalHistory {
  id: string;
  patientId: string;
  conditionType: ConditionType;
  conditionName: string;
  severity?: ConditionSeverity;
  diagnosedDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalHistoryRequest {
  patientId: string;
  conditionType: ConditionType;
  conditionName: string;
  severity?: ConditionSeverity;
  diagnosedDate?: string;
  notes?: string;
}

export interface UpdateMedicalHistoryRequest {
  conditionName?: string;
  severity?: ConditionSeverity;
  diagnosedDate?: string;
  notes?: string;
  isActive?: boolean;
}

// MEDICAL RECORD TYPES

export type RecordType =
  | 'EXAMINATION'
  | 'TREATMENT'
  | 'FOLLOW_UP'
  | 'EMERGENCY';
export type RecordStatus = 'DRAFT' | 'FINALIZED' | 'ARCHIVED';

export interface MedicalRecord {
  id: string;
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  doctorName?: string;
  clinicId: string;
  clinicName?: string;
  recordType: RecordType;
  visitDate: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: Prescription;
  notes?: string;
  status: RecordStatus;
  blockchainVerified: boolean;
  blockchainHash?: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

export interface Prescription {
  medications: Medication[];
  instructions?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface CreateMedicalRecordRequest {
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  clinicId: string;
  recordType: RecordType;
  visitDate: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: Prescription;
  notes?: string;
}

export interface UpdateMedicalRecordRequest {
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: Prescription;
  notes?: string;
  status?: RecordStatus;
}

export interface MedicalRecordSearchParams {
  page?: number;
  size?: number;
  patientId?: string;
  doctorId?: string;
  clinicId?: string;
  status?: RecordStatus;
  recordType?: RecordType;
  fromDate?: string;
  toDate?: string;
  keyword?: string;
  sort?: string[];
}

// TREATMENT HISTORY TYPES

export type TreatmentType =
  | 'FILLING'
  | 'ROOT_CANAL'
  | 'EXTRACTION'
  | 'CLEANING'
  | 'CROWN'
  | 'BRIDGE'
  | 'IMPLANT'
  | 'ORTHODONTICS'
  | 'WHITENING'
  | 'OTHER';

export type TreatmentResult = 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'IN_PROGRESS';

export interface TreatmentHistory {
  id: string;
  patientId: string;
  medicalRecordId?: string;
  treatmentType: TreatmentType;
  toothNumber?: number;
  treatmentDate: string;
  description: string;
  materials?: string[];
  performedBy: string;
  performedByName?: string;
  result?: TreatmentResult;
  complications?: string;
  followUpDate?: string;
  totalCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreatmentHistoryRequest {
  patientId: string;
  medicalRecordId?: string;
  treatmentType: TreatmentType;
  toothNumber?: number;
  treatmentDate: string;
  description: string;
  materials?: string[];
  performedBy: string;
  result?: TreatmentResult;
  complications?: string;
  followUpDate?: string;
  totalCost: number;
  notes?: string;
}

export interface UpdateTreatmentHistoryRequest {
  description?: string;
  materials?: string[];
  result?: TreatmentResult;
  complications?: string;
  followUpDate?: string;
  totalCost?: number;
  notes?: string;
}

export interface TreatmentHistorySearchParams {
  page?: number;
  size?: number;
  patientId?: string;
  treatmentType?: TreatmentType;
  toothNumber?: number;
  performedBy?: string;
  fromDate?: string;
  toDate?: string;
  sort?: string[];
}

export interface AuditLog {
  logId: string;
  recordId: string;
  accessorId: string;
  accessorRole: string;
  action: string;
  timestamp: string;
  success: boolean;
  reason?: string;
  chainTxId?: string;
}

export interface AuditTrail {
  patientId: string;
  logs: AuditLog[];
  count: number;
}

// EXPORT PDF

export interface ExportRecordRequest {
  patientId: string;
  recordIds?: string[];
  includeHistory?: boolean;
  includeTreatments?: boolean;
  includeImages?: boolean;
}

export interface ExportRecordResponse {
  fileName: string;
  downloadUrl: string;
  fileSize: number;
  generatedAt: string;
}
