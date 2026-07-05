// ============================================================
// Patient & medical record types
// ============================================================

import type { DateString, Gender, ID, SearchParams } from "./common.types";

/** Patient profile */
export interface Patient {
  id: ID;
  userId: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: DateString;
  address?: string;
  insuranceNumber?: string;
  bloodType?: string;
  allergies?: string[];
  medicalNotes?: string;
  createdAt: DateString;
  updatedAt: DateString;
}

/** Medical record (examination) */
export interface MedicalRecord {
  id: ID;
  patientId: ID;
  dentistId: ID;
  appointmentId: ID;
  diagnosis: string;
  treatmentPlan?: string;
  notes?: string;
  images?: MedicalImage[];
  isVerified: boolean;
  createdAt: DateString;
  updatedAt: DateString;
}

/** Medical image (X-ray, scan) */
export interface MedicalImage {
  id: ID;
  recordId: ID;
  url: string;
  ipfsHash?: string;
  type: "XRAY" | "SCAN" | "PHOTO";
  aiAnalysisResult?: AIAnalysisResult;
  createdAt: DateString;
}

/** AI analysis result for dental images */
export interface AIAnalysisResult {
  id: ID;
  imageId: ID;
  predictions: AIPrediction[];
  confidence: number;
  modelVersion: string;
  processedAt: DateString;
}

/** Individual AI prediction */
export interface AIPrediction {
  label: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/** Prescription */
export interface Prescription {
  id: ID;
  recordId: ID;
  patientId: ID;
  dentistId: ID;
  medications: Medication[];
  notes?: string;
  issuedAt: DateString;
}

/** Medication in a prescription */
export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

/** Patient filter params */
export interface PatientFilters extends SearchParams {
  gender?: Gender;
  clinicId?: ID;
}
