import { AppointmentStatus, PaymentStatus, ReminderChannel } from '../constants/appointment.constant';

// APPOINTMENT TYPES
export interface Appointment {
  appointmentId: string;
  appointmentCode: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  serviceId: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  notes?: string;
  estimatedPrice: number;
  paymentStatus?: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

// CREATE APPOINTMENT REQUESTS
export interface CreateAppointmentByClinicRequest {
  clinicId: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceId: string;
  notes?: string;
}

export interface CreateAppointmentBySpecialtyRequest {
  specialtyId: string;
  appointmentDate: string;
  appointmentTime: string;
  preferredClinicId?: string;
  notes?: string;
}

export interface CreateAppointmentByDoctorRequest {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceId: string;
  notes?: string;
}

export interface CreateAppointmentOutsideHoursRequest {
  clinicId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceId: string;
  reason: string;
}

export type CreateAppointmentRequest =
  | CreateAppointmentByClinicRequest
  | CreateAppointmentBySpecialtyRequest
  | CreateAppointmentByDoctorRequest
  | CreateAppointmentOutsideHoursRequest;

// UPDATE & CANCEL
export interface UpdateAppointmentRequest {
  appointmentDate?: string;
  appointmentTime?: string;
  notes?: string;
}

export interface CancelAppointmentRequest {
  reason: string;
}

// AVAILABILITY
export interface AvailabilityCheckParams {
  date: string;
  time: string;
}

// PAYMENT
export interface Payment {
  paymentId: string;
  appointmentId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  appointmentId: string;
  amount: number;
  orderInfo: string;
}

export interface VNPayResponse {
  paymentUrl: string;
  orderId: string;
}

// REMINDER
export interface Reminder {
  reminderId: string;
  appointmentId: string;
  channels: ReminderChannel[];
  scheduledAt: string;
  sentAt?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
}

export interface SendReminderRequest {
  appointmentId: string;
  channels: ReminderChannel[];
}

// LIST PARAMS
export interface AppointmentListParams {
  page?: number;
  size?: number;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
}
