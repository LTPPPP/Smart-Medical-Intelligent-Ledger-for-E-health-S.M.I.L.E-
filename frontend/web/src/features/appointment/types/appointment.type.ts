import { AppointmentStatus } from '../constants/appointment.constant';

export interface Appointment {
  appointmentId: string;
  appointmentCode: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName: string;
  clinicId?: string;
  clinicName: string;
  serviceId?: string;
  serviceName: string;
  status: AppointmentStatus;
  paymentStatus?: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
  estimatedPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentPage {
  content: Appointment[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface AppointmentListParams {
  page?: number;
  size?: number;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
}

export interface UpdateAppointmentRequest {
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

export type CreateAppointmentRequest = Record<string, unknown>;

export interface CancelAppointmentRequest {
  reason: string;
}

export interface SendReminderRequest {
  appointmentId: string;
  channels: string[];
}

export interface CreatePaymentRequest {
  appointmentId: string;
  amount: number;
  orderInfo: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}
