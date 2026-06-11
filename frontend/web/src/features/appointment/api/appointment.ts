import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { BaseResponse, PaginatedResponse } from '@/shared/types/response.type';

import {
  Appointment,
  CreateAppointmentByClinicRequest,
  CreateAppointmentBySpecialtyRequest,
  CreateAppointmentByDoctorRequest,
  CreateAppointmentOutsideHoursRequest,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
  AvailabilityCheckParams,
  Payment,
  CreatePaymentRequest,
  VNPayResponse,
  SendReminderRequest,
  AppointmentListParams,
} from '../types/appointment.type';

export const appointmentApi = {
  // CREATE APPOINTMENTS
  createByClinic: async (
    request: CreateAppointmentByClinicRequest
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.post<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.CREATE_BY_CLINIC,
      request
    );
    return data;
  },

  createBySpecialty: async (
    request: CreateAppointmentBySpecialtyRequest
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.post<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.CREATE_BY_SPECIALTY,
      request
    );
    return data;
  },

  createByDoctor: async (
    request: CreateAppointmentByDoctorRequest
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.post<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.CREATE_BY_DOCTOR,
      request
    );
    return data;
  },

  createOutsideHours: async (
    request: CreateAppointmentOutsideHoursRequest
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.post<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.CREATE_OUTSIDE_HOURS,
      request
    );
    return data;
  },

  // VIEW APPOINTMENTS
  getByClinic: async (
    clinicId: string,
    params?: AppointmentListParams
  ): Promise<BaseResponse<PaginatedResponse<Appointment>>> => {
    const { data } = await apiClient.get<BaseResponse<PaginatedResponse<Appointment>>>(
      API_ENDPOINTS.APPOINTMENT.BY_CLINIC(clinicId),
      { params }
    );
    return data;
  },

  getByDoctor: async (
    doctorId: string,
    params?: AppointmentListParams
  ): Promise<BaseResponse<PaginatedResponse<Appointment>>> => {
    const { data } = await apiClient.get<BaseResponse<PaginatedResponse<Appointment>>>(
      API_ENDPOINTS.APPOINTMENT.BY_DOCTOR(doctorId),
      { params }
    );
    return data;
  },

  getByPatient: async (
    patientId: string,
    params?: AppointmentListParams
  ): Promise<BaseResponse<PaginatedResponse<Appointment>>> => {
    const { data } = await apiClient.get<BaseResponse<PaginatedResponse<Appointment>>>(
      API_ENDPOINTS.APPOINTMENT.BY_PATIENT(patientId),
      { params }
    );
    return data;
  },

  getByDateRange: async (params: {
    entityId: string;
    entityType: 'DOCTOR' | 'CLINIC' | 'PATIENT';
    startDate: string;
    endDate: string;
  }): Promise<BaseResponse<Appointment[]>> => {
    const { data } = await apiClient.get<BaseResponse<Appointment[]>>(
      API_ENDPOINTS.APPOINTMENT.BY_DATE_RANGE,
      { params }
    );
    return data;
  },

  getById: async (appointmentId: string): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.get<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.DETAIL(appointmentId)
    );
    return data;
  },

  getByCode: async (appointmentCode: string): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.get<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.BY_CODE(appointmentCode)
    );
    return data;
  },

  // UPDATE & CANCEL
  update: async (
    appointmentId: string,
    request: UpdateAppointmentRequest
  ): Promise<BaseResponse<Appointment>> => {
    const { data } = await apiClient.put<BaseResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENT.UPDATE(appointmentId),
      request
    );
    return data;
  },

  cancel: async (
    appointmentId: string,
    request: CancelAppointmentRequest
  ): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.APPOINTMENT.CANCEL(appointmentId),
      request
    );
    return data;
  },

  confirm: async (appointmentId: string): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.put<BaseResponse<void>>(
      API_ENDPOINTS.APPOINTMENT.CONFIRM(appointmentId)
    );
    return data;
  },

  // AVAILABILITY
  checkDoctorAvailability: async (
    doctorId: string,
    params: AvailabilityCheckParams
  ): Promise<BaseResponse<boolean>> => {
    const { data } = await apiClient.get<BaseResponse<boolean>>(
      API_ENDPOINTS.APPOINTMENT.CHECK_AVAILABILITY_DOCTOR(doctorId),
      { params }
    );
    return data;
  },

  checkClinicAvailability: async (
    clinicId: string,
    params: AvailabilityCheckParams
  ): Promise<BaseResponse<boolean>> => {
    const { data } = await apiClient.get<BaseResponse<boolean>>(
      API_ENDPOINTS.APPOINTMENT.CHECK_AVAILABILITY_CLINIC(clinicId),
      { params }
    );
    return data;
  },

  // PAYMENT
  createPayment: async (request: CreatePaymentRequest): Promise<BaseResponse<VNPayResponse>> => {
    const { data } = await apiClient.post<BaseResponse<VNPayResponse>>(
      API_ENDPOINTS.VNPAY.CREATE_PAYMENT,
      request
    );
    return data;
  },

  // REMINDERS
  sendReminder: async (request: SendReminderRequest): Promise<BaseResponse<void>> => {
    const { data } = await apiClient.post<BaseResponse<void>>(
      API_ENDPOINTS.REMINDER.SEND,
      request
    );
    return data;
  },
};