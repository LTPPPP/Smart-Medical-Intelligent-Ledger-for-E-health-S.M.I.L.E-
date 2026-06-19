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
  ApiResponse,
} from '../types/appointment.type';

export const appointmentApi = {
  getByPatient: (patientId: string, params: AppointmentListParams) =>
    apiClient.get<ApiResponse<AppointmentPage>>(API_ENDPOINTS.APPOINTMENT.BY_PATIENT(patientId), { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Appointment>>(API_ENDPOINTS.APPOINTMENT.DETAIL(id)),

  update: (id: string, request: UpdateAppointmentRequest) =>
    apiClient.put<ApiResponse<Appointment>>(API_ENDPOINTS.APPOINTMENT.UPDATE(id), request),

  cancel: (id: string, request: CancelAppointmentRequest) =>
    apiClient.post<ApiResponse<Appointment>>(API_ENDPOINTS.APPOINTMENT.CANCEL(id), request),

  confirm: (id: string) =>
    apiClient.post<ApiResponse<Appointment>>(API_ENDPOINTS.APPOINTMENT.CONFIRM(id)),

  sendReminder: (request: SendReminderRequest) =>
    apiClient.post(API_ENDPOINTS.REMINDER.SEND, request),

  createPayment: (request: CreatePaymentRequest) =>
    apiClient.post<ApiResponse<{ paymentUrl: string }>>(API_ENDPOINTS.VNPAY.CREATE_PAYMENT, request),
};
