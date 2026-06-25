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

// Raw row shape returned by clinical-emr GET /api/v1/appointments (snake_case).
export interface AppointmentRow {
  appointment_id: string;
  appointment_code: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  service_id: string | null;
  room_id: string | null;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type?: string;
  status: string;
  chief_complaint?: string | null;
  payment_status: string;
  payment_id?: string | null;
  created_at?: string;
  updated_at?: string;
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

/** Mirrors the payment-service `payments` table (snake_case). */
export interface Payment {
  payment_id: string;
  appointment_id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  provider_txn_ref: string | null;
  order_info: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefundPaymentRequest {
  amount?: number;
  reason?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}
