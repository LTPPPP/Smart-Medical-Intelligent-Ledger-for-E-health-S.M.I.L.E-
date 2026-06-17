import { api } from '@/shared/lib/api';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import type { Patient, MedicalRecord, MedicalHistory, TreatmentHistory } from '../types/patient.type';

function mapPatient(raw: Record<string, unknown>): Patient {
  const ec = raw.emergency_contact as Record<string, string> | undefined;
  return {
    id: raw.patient_id as string ?? raw.id as string,
    patientCode: raw.patient_code as string,
    fullName: raw.full_name as string,
    dateOfBirth: raw.date_of_birth as string,
    gender: raw.gender as Patient['gender'],
    phone: raw.phone as string,
    email: raw.email as string | undefined,
    bloodType: raw.blood_type as string | undefined,
    address: raw.address as string | undefined,
    emergencyContact: ec
      ? { name: ec.name, phone: ec.phone, relationship: ec.relationship }
      : undefined,
    allergies: raw.allergies as string[] | undefined,
    insuranceNumber: raw.insurance_number as string | undefined,
    insuranceProvider: raw.insurance_provider as string | undefined,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
  };
}

function mapRecord(raw: Record<string, unknown>): MedicalRecord {
  const presc = raw.prescription as Record<string, unknown> | undefined;
  return {
    id: raw.record_id as string ?? raw.id as string,
    patientId: raw.patient_id as string,
    visitDate: raw.visit_date as string,
    chiefComplaint: raw.chief_complaint as string | undefined,
    diagnosis: raw.diagnosis as string,
    treatment: raw.treatment as string,
    notes: raw.notes as string | undefined,
    status: raw.status as MedicalRecord['status'],
    doctorName: raw.doctor_name as string | undefined,
    clinicName: raw.clinic_name as string | undefined,
    blockchainVerified: raw.blockchain_verified as boolean | undefined,
    blockchainHash: raw.blockchain_hash as string | undefined,
    finalizedAt: raw.finalized_at as string | undefined,
    recordType: raw.record_type as string | undefined,
    prescription: presc
      ? {
          medications: (presc.medications as import('../types/patient.type').Medication[]) ?? [],
          instructions: presc.instructions as string | undefined,
        }
      : undefined,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}

function mapHistory(raw: Record<string, unknown>): MedicalHistory {
  return {
    id: raw.history_id as string ?? raw.id as string,
    patientId: raw.patient_id as string,
    conditionName: raw.condition_name as string,
    conditionType: raw.condition_type as string,
    notes: raw.notes as string | undefined,
    createdAt: raw.created_at as string | undefined,
  };
}

function mapTreatment(raw: Record<string, unknown>): TreatmentHistory {
  return {
    id: raw.treatment_id as string ?? raw.id as string,
    patientId: raw.patient_id as string,
    recordId: raw.record_id as string | undefined,
    toothNumber: raw.tooth_number as number | undefined,
    procedure: raw.procedure as string,
    description: raw.description as string | undefined,
    cost: raw.cost as number | undefined,
    doctorName: raw.doctor_name as string | undefined,
    treatmentDate: raw.treatment_date as string,
    createdAt: raw.created_at as string | undefined,
  };
}

function normalizeSingle<T>(raw: unknown, mapper: (r: Record<string, unknown>) => T): { data: T } {
  const item = (raw as Record<string, unknown>).data ?? raw;
  return { data: mapper(item as Record<string, unknown>) };
}

function normalizeList<T>(raw: unknown, mapper: (r: Record<string, unknown>) => T): { data: T[] } {
  const payload = raw as Record<string, unknown>;
  const arr: unknown[] = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload)
    ? (payload as unknown as unknown[])
    : [];
  return { data: arr.map((r) => mapper(r as Record<string, unknown>)) };
}

export const patientApi = {
  getPatients: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(API_ENDPOINTS.PATIENT.LIST, { params });
    return normalizeList(data, mapPatient);
  },

  getPatientById: async (id: string) => {
    const { data } = await api.get(API_ENDPOINTS.PATIENT.DETAIL(id));
    return normalizeSingle(data, mapPatient);
  },

  createPatient: async (body: Partial<Record<string, unknown>>) => {
    const { data } = await api.post(API_ENDPOINTS.PATIENT.CREATE, body);
    return normalizeSingle(data, mapPatient);
  },

  updatePatient: async (id: string, body: Partial<Record<string, unknown>>) => {
    const { data } = await api.patch(API_ENDPOINTS.PATIENT.UPDATE(id), body);
    return normalizeSingle(data, mapPatient);
  },

  getMedicalRecordsByPatient: async (patientId: string) => {
    const { data } = await api.get(API_ENDPOINTS.MEDICAL_RECORD.BY_PATIENT(patientId));
    return normalizeList(data, mapRecord);
  },

  getMedicalRecordById: async (id: string) => {
    const { data } = await api.get(API_ENDPOINTS.MEDICAL_RECORD.DETAIL(id));
    return normalizeSingle(data, mapRecord);
  },

  createMedicalRecord: async (body: Partial<Record<string, unknown>>) => {
    const { data } = await api.post(API_ENDPOINTS.MEDICAL_RECORD.CREATE, body);
    return normalizeSingle(data, mapRecord);
  },

  updateMedicalRecord: async (id: string, body: Partial<Record<string, unknown>>) => {
    const { data } = await api.patch(API_ENDPOINTS.MEDICAL_RECORD.UPDATE(id), body);
    return normalizeSingle(data, mapRecord);
  },

  deleteMedicalRecord: async (id: string) => {
    await api.delete(API_ENDPOINTS.MEDICAL_RECORD.DELETE(id));
  },

  finalizeMedicalRecord: async (id: string) => {
    const { data } = await api.patch(`${API_ENDPOINTS.MEDICAL_RECORD.UPDATE(id)}/finalize`);
    return normalizeSingle(data, mapRecord);
  },

  getMedicalHistoryByPatient: async (patientId: string) => {
    const { data } = await api.get(API_ENDPOINTS.MEDICAL_HISTORY.BY_PATIENT(patientId));
    return normalizeList(data, mapHistory);
  },

  createMedicalHistory: async (body: Partial<Record<string, unknown>>) => {
    const { data } = await api.post(API_ENDPOINTS.MEDICAL_HISTORY.CREATE, body);
    return normalizeSingle(data, mapHistory);
  },

  getTreatmentHistoryByPatient: async (patientId: string) => {
    const { data } = await api.get(API_ENDPOINTS.TREATMENT_HISTORY.BY_PATIENT(patientId));
    return normalizeList(data, mapTreatment);
  },

  createTreatmentHistory: async (body: Partial<Record<string, unknown>>) => {
    const { data } = await api.post(API_ENDPOINTS.TREATMENT_HISTORY.CREATE, body);
    return normalizeSingle(data, mapTreatment);
  },
};
