import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { BaseResponse, PaginatedResponse } from '@/shared/types/response.type';

import {
  ExaminationSession,
  Diagnosis,
  Prescription,
  TreatmentPlan,
  ImagingOrder,
  LabOrder,
  CreateExaminationSessionRequest,
  UpdateExaminationSessionRequest,
  CreateDiagnosisRequest,
  UpdateDiagnosisRequest,
  CreatePrescriptionRequest,
  UpdatePrescriptionRequest,
  CreateTreatmentPlanRequest,
  UpdateTreatmentPlanRequest,
  CreateImagingOrderRequest,
  UpdateImagingOrderRequest,
  CreateLabOrderRequest,
  UpdateLabOrderRequest,
  ExaminationListParams,
  DiagnosisListParams,
  PrescriptionListParams,
  OrderListParams,
} from '../types/examination.type';

export const examinationApi = {
  // Examination Session APIs

  // Get examination sessions
  getSessionsByAppointment: async (
    appointmentId: string,
  ): Promise<BaseResponse<ExaminationSession>> => {
    const { data } = await apiClient.get<BaseResponse<ExaminationSession>>(
      API_ENDPOINTS.EXAMINATION.BY_APPOINTMENT(appointmentId),
    );
    return data;
  },

  getSessionsByPatient: async (
    patientId: string,
    params?: ExaminationListParams,
  ): Promise<BaseResponse<PaginatedResponse<ExaminationSession>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<ExaminationSession>>
    >(API_ENDPOINTS.EXAMINATION.BY_PATIENT(patientId), { params });
    return data;
  },

  getSessionById: async (
    sessionId: string,
  ): Promise<BaseResponse<ExaminationSession>> => {
    const { data } = await apiClient.get<BaseResponse<ExaminationSession>>(
      `${API_ENDPOINTS.EXAMINATION.CREATE}/${sessionId}`,
    );
    return data;
  },

  createSession: async (
    request: CreateExaminationSessionRequest,
  ): Promise<BaseResponse<ExaminationSession>> => {
    const { data } = await apiClient.post<BaseResponse<ExaminationSession>>(
      API_ENDPOINTS.EXAMINATION.CREATE,
      request,
    );
    return data;
  },

  updateSession: async (
    sessionId: string,
    request: UpdateExaminationSessionRequest,
  ): Promise<BaseResponse<ExaminationSession>> => {
    const { data } = await apiClient.put<BaseResponse<ExaminationSession>>(
      API_ENDPOINTS.EXAMINATION.UPDATE(sessionId),
      request,
    );
    return data;
  },

  deleteSession: async (sessionId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      `${API_ENDPOINTS.EXAMINATION.CREATE}/${sessionId}`,
    );
    return data;
  },

  completeSession: async (
    sessionId: string,
  ): Promise<BaseResponse<ExaminationSession>> => {
    const { data } = await apiClient.put<BaseResponse<ExaminationSession>>(
      `${API_ENDPOINTS.EXAMINATION.CREATE}/${sessionId}/complete`,
    );
    return data;
  },

  cancelSession: async (
    sessionId: string,
  ): Promise<BaseResponse<ExaminationSession>> => {
    const { data } = await apiClient.put<BaseResponse<ExaminationSession>>(
      `${API_ENDPOINTS.EXAMINATION.CREATE}/${sessionId}/cancel`,
    );
    return data;
  },

  // Diagnosis APIs

  getDiagnosesBySession: async (
    sessionId: string,
  ): Promise<BaseResponse<Diagnosis[]>> => {
    const { data } = await apiClient.get<BaseResponse<Diagnosis[]>>(
      API_ENDPOINTS.DIAGNOSIS.BY_SESSION(sessionId),
    );
    return data;
  },

  getDiagnosesByPatient: async (
    patientId: string,
    params?: DiagnosisListParams,
  ): Promise<BaseResponse<PaginatedResponse<Diagnosis>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<Diagnosis>>
    >(`${API_ENDPOINTS.DIAGNOSIS.CREATE}/patient/${patientId}`, { params });
    return data;
  },

  getDiagnosisById: async (
    diagnosisId: string,
  ): Promise<BaseResponse<Diagnosis>> => {
    const { data } = await apiClient.get<BaseResponse<Diagnosis>>(
      `${API_ENDPOINTS.DIAGNOSIS.CREATE}/${diagnosisId}`,
    );
    return data;
  },

  createDiagnosis: async (
    request: CreateDiagnosisRequest,
  ): Promise<BaseResponse<Diagnosis>> => {
    const { data } = await apiClient.post<BaseResponse<Diagnosis>>(
      API_ENDPOINTS.DIAGNOSIS.CREATE,
      request,
    );
    return data;
  },

  updateDiagnosis: async (
    diagnosisId: string,
    request: UpdateDiagnosisRequest,
  ): Promise<BaseResponse<Diagnosis>> => {
    const { data } = await apiClient.put<BaseResponse<Diagnosis>>(
      API_ENDPOINTS.DIAGNOSIS.UPDATE(diagnosisId),
      request,
    );
    return data;
  },

  deleteDiagnosis: async (diagnosisId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      `${API_ENDPOINTS.DIAGNOSIS.CREATE}/${diagnosisId}`,
    );
    return data;
  },

  // Prescription APIs

  getPrescriptionsBySession: async (
    sessionId: string,
  ): Promise<BaseResponse<Prescription>> => {
    const { data } = await apiClient.get<BaseResponse<Prescription>>(
      API_ENDPOINTS.PRESCRIPTION.BY_SESSION(sessionId),
    );
    return data;
  },

  getPrescriptionsByPatient: async (
    patientId: string,
    params?: PrescriptionListParams,
  ): Promise<BaseResponse<PaginatedResponse<Prescription>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<Prescription>>
    >(`${API_ENDPOINTS.PRESCRIPTION.CREATE}/patient/${patientId}`, { params });
    return data;
  },

  getPrescriptionById: async (
    prescriptionId: string,
  ): Promise<BaseResponse<Prescription>> => {
    const { data } = await apiClient.get<BaseResponse<Prescription>>(
      `${API_ENDPOINTS.PRESCRIPTION.CREATE}/${prescriptionId}`,
    );
    return data;
  },

  createPrescription: async (
    request: CreatePrescriptionRequest,
  ): Promise<BaseResponse<Prescription>> => {
    const { data } = await apiClient.post<BaseResponse<Prescription>>(
      API_ENDPOINTS.PRESCRIPTION.CREATE,
      request,
    );
    return data;
  },

  updatePrescription: async (
    prescriptionId: string,
    request: UpdatePrescriptionRequest,
  ): Promise<BaseResponse<Prescription>> => {
    const { data } = await apiClient.put<BaseResponse<Prescription>>(
      `${API_ENDPOINTS.PRESCRIPTION.CREATE}/${prescriptionId}`,
      request,
    );
    return data;
  },

  deletePrescription: async (
    prescriptionId: string,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      `${API_ENDPOINTS.PRESCRIPTION.CREATE}/${prescriptionId}`,
    );
    return data;
  },

  dispensePrescription: async (
    prescriptionId: string,
  ): Promise<BaseResponse<Prescription>> => {
    const { data } = await apiClient.put<BaseResponse<Prescription>>(
      `${API_ENDPOINTS.PRESCRIPTION.CREATE}/${prescriptionId}/dispense`,
    );
    return data;
  },

  cancelPrescription: async (
    prescriptionId: string,
  ): Promise<BaseResponse<Prescription>> => {
    const { data } = await apiClient.put<BaseResponse<Prescription>>(
      `${API_ENDPOINTS.PRESCRIPTION.CREATE}/${prescriptionId}/cancel`,
    );
    return data;
  },

  // Treatment Plan APIs

  getTreatmentPlansByPatient: async (
    patientId: string,
  ): Promise<BaseResponse<TreatmentPlan[]>> => {
    const { data } = await apiClient.get<BaseResponse<TreatmentPlan[]>>(
      API_ENDPOINTS.TREATMENT_PLAN.BY_PATIENT(patientId),
    );
    return data;
  },

  getTreatmentPlanById: async (
    planId: string,
  ): Promise<BaseResponse<TreatmentPlan>> => {
    const { data } = await apiClient.get<BaseResponse<TreatmentPlan>>(
      `${API_ENDPOINTS.TREATMENT_PLAN.CREATE}/${planId}`,
    );
    return data;
  },

  createTreatmentPlan: async (
    request: CreateTreatmentPlanRequest,
  ): Promise<BaseResponse<TreatmentPlan>> => {
    const { data } = await apiClient.post<BaseResponse<TreatmentPlan>>(
      API_ENDPOINTS.TREATMENT_PLAN.CREATE,
      request,
    );
    return data;
  },

  updateTreatmentPlan: async (
    planId: string,
    request: UpdateTreatmentPlanRequest,
  ): Promise<BaseResponse<TreatmentPlan>> => {
    const { data } = await apiClient.put<BaseResponse<TreatmentPlan>>(
      `${API_ENDPOINTS.TREATMENT_PLAN.CREATE}/${planId}`,
      request,
    );
    return data;
  },

  deleteTreatmentPlan: async (planId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.delete<BaseResponse<void>>(
      `${API_ENDPOINTS.TREATMENT_PLAN.CREATE}/${planId}`,
    );
    return data;
  },

  completeTreatmentPlan: async (
    planId: string,
  ): Promise<BaseResponse<TreatmentPlan>> => {
    const { data } = await apiClient.put<BaseResponse<TreatmentPlan>>(
      `${API_ENDPOINTS.TREATMENT_PLAN.CREATE}/${planId}/complete`,
    );
    return data;
  },

  discontinueTreatmentPlan: async (
    planId: string,
  ): Promise<BaseResponse<TreatmentPlan>> => {
    const { data } = await apiClient.put<BaseResponse<TreatmentPlan>>(
      `${API_ENDPOINTS.TREATMENT_PLAN.CREATE}/${planId}/discontinue`,
    );
    return data;
  },

  // Imaging Order APIs

  createImagingOrder: async (
    request: CreateImagingOrderRequest,
  ): Promise<BaseResponse<ImagingOrder>> => {
    const { data } = await apiClient.post<BaseResponse<ImagingOrder>>(
      '/api/examination/imaging-orders',
      request,
    );
    return data;
  },

  getImagingOrdersByPatient: async (
    patientId: string,
    params?: OrderListParams,
  ): Promise<BaseResponse<PaginatedResponse<ImagingOrder>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<ImagingOrder>>
    >(`/api/examination/imaging-orders/patient/${patientId}`, { params });
    return data;
  },

  updateImagingOrder: async (
    orderId: string,
    request: UpdateImagingOrderRequest,
  ): Promise<BaseResponse<ImagingOrder>> => {
    const { data } = await apiClient.put<BaseResponse<ImagingOrder>>(
      `/api/examination/imaging-orders/${orderId}`,
      request,
    );
    return data;
  },

  scheduleImagingOrder: async (
    orderId: string,
    scheduledAt: string,
  ): Promise<BaseResponse<ImagingOrder>> => {
    const { data } = await apiClient.put<BaseResponse<ImagingOrder>>(
      `/api/examination/imaging-orders/${orderId}/schedule`,
      { scheduledAt },
    );
    return data;
  },

  completeImagingOrder: async (
    orderId: string,
    findings: string,
  ): Promise<BaseResponse<ImagingOrder>> => {
    const { data } = await apiClient.put<BaseResponse<ImagingOrder>>(
      `/api/examination/imaging-orders/${orderId}/complete`,
      { findings },
    );
    return data;
  },

  // Lab Order APIs

  createLabOrder: async (
    request: CreateLabOrderRequest,
  ): Promise<BaseResponse<LabOrder>> => {
    const { data } = await apiClient.post<BaseResponse<LabOrder>>(
      '/api/examination/lab-orders',
      request,
    );
    return data;
  },

  getLabOrdersByPatient: async (
    patientId: string,
    params?: OrderListParams,
  ): Promise<BaseResponse<PaginatedResponse<LabOrder>>> => {
    const { data } = await apiClient.get<
      BaseResponse<PaginatedResponse<LabOrder>>
    >(`/api/examination/lab-orders/patient/${patientId}`, { params });
    return data;
  },

  updateLabOrder: async (
    orderId: string,
    request: UpdateLabOrderRequest,
  ): Promise<BaseResponse<LabOrder>> => {
    const { data } = await apiClient.put<BaseResponse<LabOrder>>(
      `/api/examination/lab-orders/${orderId}`,
      request,
    );
    return data;
  },

  scheduleLabOrder: async (
    orderId: string,
    scheduledAt: string,
  ): Promise<BaseResponse<LabOrder>> => {
    const { data } = await apiClient.put<BaseResponse<LabOrder>>(
      `/api/examination/lab-orders/${orderId}/schedule`,
      { scheduledAt },
    );
    return data;
  },

  completeLabOrder: async (
    orderId: string,
    results: Record<string, any>,
  ): Promise<BaseResponse<LabOrder>> => {
    const { data } = await apiClient.put<BaseResponse<LabOrder>>(
      `/api/examination/lab-orders/${orderId}/complete`,
      { results },
    );
    return data;
  },
};
