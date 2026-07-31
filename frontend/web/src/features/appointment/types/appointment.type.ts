import type { AppointmentStatus } from "../constants/appointment.constant";

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
	option_token?: string;
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

export interface AppointmentAvailabilityRequest {
	patient_id: string;
	clinic_id: string;
	service_id: string;
	date_from: string;
	date_to: string;
	doctor_id?: string;
	time_of_day?: string;
}

export interface AppointmentAvailabilitySlot {
	option_token?: string;
	start_time: string;
	occupied_until: string;
	status: "available" | "booked";
}

export interface AppointmentAvailabilityDoctor {
	doctor_id: string;
	clinic_id?: string;
	room?: {
		room_id?: string;
		room_name?: string;
	};
	slots: AppointmentAvailabilitySlot[];
}

export interface AppointmentAvailabilityDate {
	date: string;
	doctors: AppointmentAvailabilityDoctor[];
}

export interface AppointmentAvailabilityResponse {
	service?: {
		id?: string;
		name?: string;
		duration_minutes?: number;
	};
	dates: AppointmentAvailabilityDate[];
}

export interface BookAppointmentOptionRequest {
	patient_id: string;
	option_token: string;
	created_by: string;
	appointment_type?: string;
	chief_complaint?: string;
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
	refund_status:
		| "REQUESTED"
		| "UNDER_REVIEW"
		| "APPROVED"
		| "REFUNDING"
		| "REFUNDED"
		| "REJECTED"
		| null;
	refund_reason: string | null;
	refund_requested_by: string | null;
	refund_requested_at: string | null;
	refund_reviewed_by: string | null;
	refund_reviewed_at: string | null;
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
