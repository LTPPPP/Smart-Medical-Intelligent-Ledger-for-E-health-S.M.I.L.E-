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
import {
  type AmendmentFormLike,
  buildExaminationAmendmentPayload,
} from '../utils/amendmentFlow';
import {
  type FollowUpFormLike,
  buildFollowUpAppointmentPayload,
} from '../utils/followUpFlow';
import {
  type BackendPrescription,
  mapBackendPrescription,
  toPrescriptionItemPayload,
  validatePrescriptionItemForm,
} from '../utils/prescriptionFlow';

const PRESCRIPTION_ITEMS_ENDPOINT = API_ENDPOINTS.PRESCRIPTION.CREATE.replace(
  '/prescriptions',
  '/prescription-items',
);

type ApiPayload<T> = BaseResponse<T> | T;

interface FollowUpAppointment {
  appointment_id: string;
  appointment_date?: string | null;
  appointment_time?: string | null;
  duration_minutes?: number | null;
  appointment_type?: string | null;
  status?: string | null;
  notes?: string | null;
  session_id?: string | null;
  treatment_plan_id?: string | null;
}

interface FollowUpAppointmentPage {
  data: FollowUpAppointment[];
  total?: number;
}

interface CreateFollowUpInput {
  sessionId: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  actorId: string;
  treatmentPlanId?: string | null;
  form: FollowUpFormLike;
}

interface ExaminationAmendment {
  amendment_id: string;
  amendment_reason: string;
  amendment_text: string;
  amended_by?: string | null;
  created_at?: string | null;
}

function isBaseResponse<T>(payload: ApiPayload<T>): payload is BaseResponse<T> {
  return (
    payload !== null &&
    typeof payload === 'object' &&
    'data' in payload &&
    'success' in payload
  );
}

function unwrapPayload<T>(payload: ApiPayload<T>): T {
  return isBaseResponse(payload) ? payload.data : payload;
}

function wrapPayload<T>(payload: ApiPayload<unknown>, data: T): BaseResponse<T> {
  if (isBaseResponse(payload)) {
    return {
      ...payload,
      data,
    };
  }

  return {
    data,
    success: true,
    message: '',
  };
}

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
      {
        appointment_id: request.appointmentId,
        patient_id: request.patientId,
        doctor_id: request.doctorId,
        clinic_id: request.clinicId,
        chief_complaint: request.chiefComplaint,
        vital_signs: request.vitalSigns,
        notes: request.notes,
      },
    );
    return data;
  },

  updateSession: async (
    sessionId: string,
    request: UpdateExaminationSessionRequest,
  ): Promise<BaseResponse<ExaminationSession>> => {
    const { data } = await apiClient.patch<BaseResponse<ExaminationSession>>(
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
    const { data } = await apiClient.patch<BaseResponse<ExaminationSession>>(
      `${API_ENDPOINTS.EXAMINATION.CREATE}/${sessionId}/finalize`,
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

  getFollowUpsBySession: async (
    sessionId: string,
  ): Promise<FollowUpAppointmentPage> => {
    const { data } = await apiClient.get<FollowUpAppointmentPage>(
      API_ENDPOINTS.APPOINTMENT.LIST,
      {
        params: {
          session_id: sessionId,
          appointment_type: 'follow_up',
          limit: 50,
        },
      },
    );
    return data;
  },

  createFollowUp: async (
    input: CreateFollowUpInput,
  ): Promise<FollowUpAppointment> => {
    const { data } = await apiClient.post<FollowUpAppointment>(
      API_ENDPOINTS.APPOINTMENT.LIST,
      buildFollowUpAppointmentPayload(input),
    );
    return data;
  },

  getAmendmentsBySession: async (
    sessionId: string,
  ): Promise<BaseResponse<ExaminationAmendment[]>> => {
    const { data } = await apiClient.get<ApiPayload<ExaminationAmendment[]>>(
      `${API_ENDPOINTS.EXAMINATION.CREATE}/${sessionId}/amendments`,
    );
    return wrapPayload(data, unwrapPayload(data));
  },

  createAmendment: async (
    sessionId: string,
    form: AmendmentFormLike,
  ): Promise<BaseResponse<ExaminationAmendment>> => {
    const { data } = await apiClient.post<ApiPayload<ExaminationAmendment>>(
      `${API_ENDPOINTS.EXAMINATION.CREATE}/${sessionId}/amendments`,
      buildExaminationAmendmentPayload(form),
    );
    return wrapPayload(data, unwrapPayload(data));
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
  ): Promise<BaseResponse<Prescription | null>> => {
    const { data } = await apiClient.get<
      ApiPayload<BackendPrescription | null>
    >(
      API_ENDPOINTS.PRESCRIPTION.BY_SESSION(sessionId),
    );
    return wrapPayload(data, mapBackendPrescription(unwrapPayload(data)));
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
    const itemPayloads = request.items.map((item) =>
      toPrescriptionItemPayload('__pending__', item),
    );
    const validationError = itemPayloads
      .map(validatePrescriptionItemForm)
      .find((error): error is string => Boolean(error));
    if (validationError) {
      throw new Error(validationError);
    }

    const { data } = await apiClient.post<ApiPayload<BackendPrescription>>(
      API_ENDPOINTS.PRESCRIPTION.CREATE,
      {
        session_id: request.sessionId,
        patient_id: request.patientId,
        notes: request.notes,
      },
    );

    const prescription = mapBackendPrescription(unwrapPayload(data));
    if (!prescription?.id) {
      throw new Error('Prescription ID is missing from create response.');
    }

    await Promise.all(
      itemPayloads.map((item) =>
        apiClient.post(
          PRESCRIPTION_ITEMS_ENDPOINT,
          {
            ...item,
            prescription_id: prescription.id,
          },
        ),
      ),
    );

    const refreshed = await examinationApi.getPrescriptionsBySession(
      request.sessionId,
    );
    if (!refreshed.data) {
      throw new Error('Created prescription was not returned by session query.');
    }

    return {
      ...refreshed,
      data: refreshed.data,
    };
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
    const { data } = await apiClient.patch<BaseResponse<Prescription>>(
      `${API_ENDPOINTS.PRESCRIPTION.CREATE}/${prescriptionId}/issue`,
    );
    return data;
  },

  cancelPrescription: async (
    prescriptionId: string,
    reason = 'Cancelled by doctor',
  ): Promise<BaseResponse<Prescription>> => {
    const { data } = await apiClient.patch<BaseResponse<Prescription>>(
      `${API_ENDPOINTS.PRESCRIPTION.CREATE}/${prescriptionId}/cancel`,
      { reason },
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

  getTreatmentPlansBySession: async (
    sessionId: string,
  ): Promise<BaseResponse<TreatmentPlan[]>> => {
    const { data } = await apiClient.get<ApiPayload<TreatmentPlan[]>>(
      API_ENDPOINTS.TREATMENT_PLAN.BY_SESSION(sessionId),
    );
    return wrapPayload(data, unwrapPayload(data));
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
      {
        session_id: request.session_id ?? request.sessionId,
        patient_id: request.patient_id ?? request.patientId,
        record_id: request.record_id,
        plan_name: request.plan_name ?? request.title,
        objectives: request.objectives,
        duration_weeks: request.duration_weeks,
        estimated_cost: request.estimated_cost,
        quote_currency: request.quote_currency,
        quote_version: request.quote_version,
        risk_disclosure: request.risk_disclosure,
        alternative_options: request.alternative_options,
        created_by: request.created_by,
      },
    );
    return data;
  },

  updateTreatmentPlan: async (
    planId: string,
    request: UpdateTreatmentPlanRequest,
  ): Promise<BaseResponse<TreatmentPlan>> => {
    const { data } = await apiClient.patch<BaseResponse<TreatmentPlan>>(
      `${API_ENDPOINTS.TREATMENT_PLAN.CREATE}/${planId}`,
      request,
    );
    return data;
  },

  proposeTreatmentPlan: async (
    planId: string,
  ): Promise<BaseResponse<TreatmentPlan>> => {
    const { data } = await apiClient.patch<BaseResponse<TreatmentPlan>>(
      `${API_ENDPOINTS.TREATMENT_PLAN.CREATE}/${planId}/propose`,
    );
    return data;
  },

  acceptTreatmentPlan: async (
    planId: string,
    acceptedBy: string,
    options?: {
      acceptance_scope?: 'full' | 'partial';
      accepted_scope_note?: string;
    },
  ): Promise<BaseResponse<TreatmentPlan>> => {
    const { data } = await apiClient.patch<BaseResponse<TreatmentPlan>>(
      `${API_ENDPOINTS.TREATMENT_PLAN.CREATE}/${planId}/accept`,
      { accepted_by: acceptedBy, ...options },
    );
    return data;
  },

  declineTreatmentPlan: async (
    planId: string,
    declinedBy: string,
    reason?: string,
  ): Promise<BaseResponse<TreatmentPlan>> => {
    const { data } = await apiClient.patch<BaseResponse<TreatmentPlan>>(
      `${API_ENDPOINTS.TREATMENT_PLAN.CREATE}/${planId}/decline`,
      { declined_by: declinedBy, reason },
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
    results: Record<string, unknown>,
  ): Promise<BaseResponse<LabOrder>> => {
    const { data } = await apiClient.put<BaseResponse<LabOrder>>(
      `/api/examination/lab-orders/${orderId}/complete`,
      { results },
    );
    return data;
  },
};
