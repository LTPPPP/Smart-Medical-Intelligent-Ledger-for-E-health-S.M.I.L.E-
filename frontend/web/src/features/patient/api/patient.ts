import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { BaseResponse, PaginatedResponse } from '@/shared/types/response.type';

import {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientSearchParams,
  MedicalHistory,
  CreateMedicalHistoryRequest,
  UpdateMedicalHistoryRequest,
  MedicalRecord,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  MedicalRecordSearchParams,
  TreatmentHistory,
  CreateTreatmentHistoryRequest,
  UpdateTreatmentHistoryRequest,
  TreatmentHistorySearchParams,
  ExportRecordRequest,
  ExportRecordResponse,
} from '../types/patient.type';

export const patientApi = {
  // PATIENT MANAGEMENT

  createPatient: async (
    request: CreatePatientRequest,
  ): Promise<BaseResponse<Patient>> => {
    const { data } = await apiClient.post<BaseResponse<Patient>>(
      API_ENDPOINTS.PATIENT.CREATE,
      request,
    );
    return data;
  },

  getPatientById: async (patientId: string): Promise<BaseResponse<Patient>> => {
    const { data } = await apiClient.get<BaseResponse<Patient>>(
      API_ENDPOINTS.PATIENT.DETAIL(patientId),
    );
    return data;
  },

  getPatients: async (
    params?: PatientSearchParams,
  ): Promise<BaseResponse<PaginatedResponse<Patient>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<Patient>>
    >(API_ENDPOINTS.PATIENT.LIST, { params });
    return data;
  },

  updatePatient: async (
    patientId: string,
    request: UpdatePatientRequest,
  ): Promise<BaseResponse<Patient>> => {
    const { data } = await apiClient.put<BaseResponse<Patient>>(
      API_ENDPOINTS.PATIENT.UPDATE(patientId),
      request,
    );
    return data;
  },

  /**
   * Delete patient (soft delete)
   */
  deletePatient: async (patientId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.PATIENT.DETAIL(patientId),
    );
    return data;
  },

  // MEDICAL HISTORY

  createMedicalHistory: async (
    request: CreateMedicalHistoryRequest,
  ): Promise<BaseResponse<MedicalHistory>> => {
    const { data } = await apiClient.post<BaseResponse<MedicalHistory>>(
      API_ENDPOINTS.MEDICAL_HISTORY.CREATE,
      request,
    );
    return data;
  },

  /**
   * Get medical history by patient
   */
  getMedicalHistoryByPatient: async (
    patientId: string,
  ): Promise<BaseResponse<MedicalHistory[]>> => {
    const { data } = await apiClient.get<BaseResponse<MedicalHistory[]>>(
      API_ENDPOINTS.MEDICAL_HISTORY.BY_PATIENT(patientId),
    );
    return data;
  },

  /**
   * Update medical history
   */
  updateMedicalHistory: async (
    historyId: string,
    request: UpdateMedicalHistoryRequest,
  ): Promise<BaseResponse<MedicalHistory>> => {
    const { data } = await apiClient.put<BaseResponse<MedicalHistory>>(
      API_ENDPOINTS.MEDICAL_HISTORY.UPDATE(historyId),
      request,
    );
    return data;
  },

  /**
   * Delete medical history
   */
  deleteMedicalHistory: async (
    historyId: string,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.MEDICAL_HISTORY.DELETE(historyId),
    );
    return data;
  },

  // MEDICAL RECORD

  createMedicalRecord: async (
    request: CreateMedicalRecordRequest,
  ): Promise<BaseResponse<MedicalRecord>> => {
    const { data } = await apiClient.post<BaseResponse<MedicalRecord>>(
      API_ENDPOINTS.MEDICAL_RECORD.CREATE,
      request,
    );
    return data;
  },

  // getMedicalRecordsByPatient: async (
  //   patientId: string,
  //   params?: MedicalRecordSearchParams,
  // ): Promise<BaseResponse<PaginatedResponse<MedicalRecord>>> => {
  //   const { data } = await apiClient.get<
  //     BaseResponse<PaginatedResponse<MedicalRecord>>
  //   >(API_ENDPOINTS.MEDICAL_RECORD.BY_PATIENT(patientId));
  //   return data;
  // },

  getMedicalRecordsListByPatient: async (
    patientId: string,
    params?: MedicalRecordSearchParams,
  ): Promise<BaseResponse<PaginatedResponse<MedicalRecord>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<MedicalRecord>>
    >(API_ENDPOINTS.MEDICAL_RECORD.LIST_BY_PATIENT(patientId), { params });
    return data;
  },

  /**
   * Get medical record by ID
   */
  getMedicalRecordById: async (
    recordId: string,
  ): Promise<BaseResponse<MedicalRecord>> => {
    const { data } = await apiClient.get<BaseResponse<MedicalRecord>>(
      API_ENDPOINTS.MEDICAL_RECORD.DETAIL(recordId),
    );
    return data;
  },

  updateMedicalRecord: async (
    recordId: string,
    request: UpdateMedicalRecordRequest,
  ): Promise<BaseResponse<MedicalRecord>> => {
    const { data } = await apiClient.put<BaseResponse<MedicalRecord>>(
      API_ENDPOINTS.MEDICAL_RECORD.UPDATE(recordId),
      request,
    );
    return data;
  },

  /**
   * Finalize medical record (make immutable)
   */
  finalizeMedicalRecord: async (
    recordId: string,
  ): Promise<BaseResponse<MedicalRecord>> => {
    const { data } = await apiClient.put<BaseResponse<MedicalRecord>>(
      `${API_ENDPOINTS.MEDICAL_RECORD.DETAIL(recordId)}/finalize`,
    );
    return data;
  },

  /**
   * Delete medical record
   */
  deleteMedicalRecord: async (
    recordId: string,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.MEDICAL_RECORD.DETAIL(recordId),
    );
    return data;
  },

  // TREATMENT HISTORY

  createTreatmentHistory: async (
    request: CreateTreatmentHistoryRequest,
  ): Promise<BaseResponse<TreatmentHistory>> => {
    const { data } = await apiClient.post<BaseResponse<TreatmentHistory>>(
      API_ENDPOINTS.TREATMENT_HISTORY.CREATE,
      request,
    );
    return data;
  },

  getTreatmentHistoryByPatient: async (
    patientId: string,
    params?: TreatmentHistorySearchParams,
  ): Promise<BaseResponse<TreatmentHistory[]>> => {
    const { data } = await apiClient.get<BaseResponse<TreatmentHistory[]>>(
      API_ENDPOINTS.TREATMENT_HISTORY.BY_PATIENT(patientId),
      { params },
    );
    return data;
  },

  updateTreatmentHistory: async (
    treatmentId: string,
    request: UpdateTreatmentHistoryRequest,
  ): Promise<BaseResponse<TreatmentHistory>> => {
    const { data } = await apiClient.put<BaseResponse<TreatmentHistory>>(
      API_ENDPOINTS.TREATMENT_HISTORY.UPDATE(treatmentId),
      request,
    );
    return data;
  },

  /**
   * Delete treatment history
   */
  deleteTreatmentHistory: async (
    treatmentId: string,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      API_ENDPOINTS.TREATMENT_HISTORY.DELETE(treatmentId),
    );
    return data;
  },

  // EXPORT
  exportRecordsToPdf: async (
    request: ExportRecordRequest,
  ): Promise<BaseResponse<ExportRecordResponse>> => {
    const { data } = await apiClient.post<BaseResponse<ExportRecordResponse>>(
      `${API_ENDPOINTS.PATIENT.LIST}/export-pdf`,
      request,
      {
        responseType: 'json',
      },
    );
    return data;
  },

  /**
   * Download exported PDF
   */
  downloadPdf: async (fileName: string): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(
      `${API_ENDPOINTS.PATIENT.LIST}/download/${fileName}`,
      {
        responseType: 'blob',
      },
    );
    return data;
  },
};
