import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';

import type {
  Appointment,
  AppointmentPage,
  AppointmentListParams,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
  ConfirmAppointmentRequest,
  SendReminderRequest,
  CreatePaymentRequest,
  CreateAppointmentRequest,
  ApiResponse,
} from '../types/appointment.type';

function unwrap<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

function normalizeAppointment(raw: Record<string, unknown>): Appointment {
  const status = String(raw.status ?? '').toLowerCase() as Appointment['status'];
  const paymentStatus = raw.paymentStatus ?? raw.payment_status;

  return {
    appointmentId: String(raw.appointmentId ?? raw.appointment_id ?? raw.id ?? ''),
    appointmentCode: String(raw.appointmentCode ?? raw.appointment_code ?? ''),
    patientId: String(raw.patientId ?? raw.patient_id ?? ''),
    patientName: String(raw.patientName ?? raw.patient_name ?? ''),
    doctorId: raw.doctorId ?? raw.doctor_id ? String(raw.doctorId ?? raw.doctor_id) : undefined,
    doctorName: String(raw.doctorName ?? raw.doctor_name ?? raw.doctor_id ?? ''),
    clinicId: raw.clinicId ?? raw.clinic_id ? String(raw.clinicId ?? raw.clinic_id) : undefined,
    clinicName: String(raw.clinicName ?? raw.clinic_name ?? raw.clinic_id ?? ''),
    serviceId: raw.serviceId ?? raw.service_id ? String(raw.serviceId ?? raw.service_id) : undefined,
    serviceName: String(raw.serviceName ?? raw.service_name ?? raw.service_id ?? ''),
    status,
    paymentStatus: paymentStatus ? String(paymentStatus).toLowerCase() : undefined,
    appointmentDate: String(raw.appointmentDate ?? raw.appointment_date ?? ''),
    appointmentTime: String(raw.appointmentTime ?? raw.appointment_time ?? ''),
    notes: raw.notes ? String(raw.notes) : undefined,
    estimatedPrice: Number(raw.estimatedPrice ?? raw.estimated_price ?? raw.price ?? 0),
    createdAt: raw.createdAt ?? raw.created_at ? String(raw.createdAt ?? raw.created_at) : undefined,
    updatedAt: raw.updatedAt ?? raw.updated_at ? String(raw.updatedAt ?? raw.updated_at) : undefined,
  };
}

function normalizeAppointmentPage(payload: AppointmentPage | Appointment[] | { data: Appointment[]; total: number }): AppointmentPage {
  if (Array.isArray(payload)) {
    return {
      content: payload.map((appointment) => normalizeAppointment(appointment as unknown as Record<string, unknown>)),
      totalPages: 1,
      totalElements: payload.length,
      size: payload.length,
      number: 0,
    };
  }

  if ('data' in payload && Array.isArray(payload.data)) {
    return {
      content: payload.data.map((appointment) => normalizeAppointment(appointment as unknown as Record<string, unknown>)),
      totalPages: 1,
      totalElements: payload.total,
      size: payload.data.length,
      number: 0,
    };
  }

  const page = payload as AppointmentPage;

  return {
    ...page,
    content: Array.isArray(page.content)
      ? page.content.map((appointment) => normalizeAppointment(appointment as unknown as Record<string, unknown>))
      : [],
  };
}

export const appointmentApi = {
  getByPatient: async (patientId: string, params: AppointmentListParams): Promise<AppointmentPage> => {
    const { data } = await apiClient.get<ApiResponse<AppointmentPage | Appointment[]> | AppointmentPage | Appointment[]>(
      API_ENDPOINTS.APPOINTMENT.BY_PATIENT(patientId),
      { params },
    );
    return normalizeAppointmentPage(unwrap(data));
  },

  getById: async (id: string): Promise<Appointment> => {
    const { data } = await apiClient.get<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.DETAIL(id));
    return normalizeAppointment(unwrap(data) as unknown as Record<string, unknown>);
  },

  update: async (id: string, request: UpdateAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.patch<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.UPDATE(id), request);
    return normalizeAppointment(unwrap(data) as unknown as Record<string, unknown>);
  },

  cancel: async (id: string, request: CancelAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.patch<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CANCEL(id), request);
    return normalizeAppointment(unwrap(data) as unknown as Record<string, unknown>);
  },

  confirm: async (id: string, request: ConfirmAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.patch<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CONFIRM(id), request);
    return normalizeAppointment(unwrap(data) as unknown as Record<string, unknown>);
  },

  createByClinic: async (request: CreateAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CREATE_BY_CLINIC, request);
    return normalizeAppointment(unwrap(data) as unknown as Record<string, unknown>);
  },

  createBySpecialty: async (request: CreateAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CREATE_BY_SPECIALTY, request);
    return normalizeAppointment(unwrap(data) as unknown as Record<string, unknown>);
  },

  createByDoctor: async (request: CreateAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CREATE_BY_DOCTOR, request);
    return normalizeAppointment(unwrap(data) as unknown as Record<string, unknown>);
  },

  createOutsideHours: async (request: CreateAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CREATE_OUTSIDE_HOURS, request);
    return normalizeAppointment(unwrap(data) as unknown as Record<string, unknown>);
  },

  sendReminder: (request: SendReminderRequest) =>
    apiClient.post(API_ENDPOINTS.REMINDER.SEND, request),

  createPayment: async (request: CreatePaymentRequest): Promise<{ paymentUrl: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ paymentUrl: string }> | { paymentUrl: string }>(
      API_ENDPOINTS.VNPAY.CREATE_PAYMENT,
      request,
    );
    return unwrap(data);
  },
};
