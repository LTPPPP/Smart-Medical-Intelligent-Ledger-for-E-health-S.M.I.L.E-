import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';

import type {
  Appointment,
  AppointmentPage,
  AppointmentListParams,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
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

export const appointmentApi = {
  getByPatient: async (patientId: string, params: AppointmentListParams): Promise<AppointmentPage> => {
    const { data } = await apiClient.get<ApiResponse<AppointmentPage> | AppointmentPage>(
      API_ENDPOINTS.APPOINTMENT.BY_PATIENT(patientId),
      { params },
    );
    return unwrap(data);
  },

  getById: async (id: string): Promise<Appointment> => {
    const { data } = await apiClient.get<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.DETAIL(id));
    return unwrap(data);
  },

  update: async (id: string, request: UpdateAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.put<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.UPDATE(id), request);
    return unwrap(data);
  },

  cancel: async (id: string, request: CancelAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CANCEL(id), request);
    return unwrap(data);
  },

  confirm: async (id: string): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CONFIRM(id));
    return unwrap(data);
  },

  createByClinic: async (request: CreateAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CREATE_BY_CLINIC, request);
    return unwrap(data);
  },

  createBySpecialty: async (request: CreateAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CREATE_BY_SPECIALTY, request);
    return unwrap(data);
  },

  createByDoctor: async (request: CreateAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CREATE_BY_DOCTOR, request);
    return unwrap(data);
  },

  createOutsideHours: async (request: CreateAppointmentRequest): Promise<Appointment> => {
    const { data } = await apiClient.post<ApiResponse<Appointment> | Appointment>(API_ENDPOINTS.APPOINTMENT.CREATE_OUTSIDE_HOURS, request);
    return unwrap(data);
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
