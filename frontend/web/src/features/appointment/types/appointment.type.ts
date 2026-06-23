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
  appointment_date?: string;
  appointment_time?: string;
  room_id?: string;
  service_id?: string;
  appointment_type?: string;
  duration_minutes?: number;
  chief_complaint?: string;
  notes?: string;
  updated_by?: string;
}

export interface CreateAppointmentRequest {
  patient_id: string;
  clinic_id: string;
  created_by: string;
  doctor_id?: string;
  specialty_id?: string;
  room_id?: string;
  service_id?: string;
  appointment_date?: string;
  appointment_time?: string;
  preferred_date?: string;
  preferred_time?: string;
  duration_minutes?: number;
  appointment_type?: string;
  chief_complaint?: string;
  outside_hours_reason?: string;
  approved_by?: string;
  notes?: string;
}

export interface CancelAppointmentRequest {
  cancelled_by: string;
  cancellation_reason?: string;
}

export interface ConfirmAppointmentRequest {
  changed_by: string;
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
