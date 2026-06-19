import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { BaseResponse } from '@/shared/types/response.type';

export interface Appointment {
  appointmentId: string;
  appointmentCode: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  paymentStatus?: string;
  estimatedPrice: number;
  notes?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  serviceName: string;
  serviceId?: string;
}

export interface CancelAppointmentRequest {
  reason: string;
}

export interface UpdateAppointmentRequest {
  appointmentDate?: string;
  appointmentTime?: string;
  notes?: string;
}

export interface CreatePaymentRequest {
  appointmentId: string;
  amount: number;
  orderInfo: string;
}

export interface SendReminderRequest {
  appointmentId: string;
  channels: string[];
}

export const appointmentApi = {
  getById: async (id: string): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.get<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.DETAIL(id),
    );
    return data;
  },

  update: async (
    id: string,
    request: UpdateAppointmentRequest,
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.patch<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.UPDATE(id),
      request,
    );
    return data;
  },

  cancel: async (
    id: string,
    request: CancelAppointmentRequest,
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.patch<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.CANCEL(id),
      request,
    );
    return data;
  },

  confirm: async (id: string): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.patch<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.CONFIRM(id),
      {},
    );
    return data;
  },

  createByClinic: async (
    request: Record<string, unknown>,
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.post<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.CREATE_BY_CLINIC,
      request,
    );
    return data;
  },

  createBySpecialty: async (
    request: Record<string, unknown>,
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.post<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.CREATE_BY_SPECIALTY,
      request,
    );
    return data;
  },

  createByDoctor: async (
    request: Record<string, unknown>,
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.post<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.CREATE_BY_DOCTOR,
      request,
    );
    return data;
  },

  createOutsideHours: async (
    request: Record<string, unknown>,
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.post<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.CREATE_OUTSIDE_HOURS,
      request,
    );
    return data;
  },

  createPayment: async (
    request: CreatePaymentRequest,
  ): Promise<BaseResponse<{ paymentUrl: string }>> => {
    const { data } = await apiClient.post<BaseResponse<{ paymentUrl: string }>>(
      API_ENDPOINTS.VNPAY.CREATE_PAYMENT,
      request,
    );
    return data;
  },

  sendReminder: async (
    request: SendReminderRequest,
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.post<BaseResponse<void>>(
      API_ENDPOINTS.REMINDER.SEND,
      request,
    );
    return data;
  },
};
