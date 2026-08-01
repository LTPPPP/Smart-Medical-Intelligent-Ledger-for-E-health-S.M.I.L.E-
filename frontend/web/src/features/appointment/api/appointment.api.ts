import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

import type {
	Appointment,
	AppointmentPage,
	AppointmentRow,
	AppointmentListParams,
	AppointmentAvailabilityRequest,
	AppointmentAvailabilityResponse,
	UpdateAppointmentRequest,
	CancelAppointmentRequest,
	SendReminderRequest,
	CreatePaymentRequest,
	Payment,
	RefundPaymentRequest,
	ApiResponse,
} from "../types/appointment.type";

export const appointmentApi = {
	// Raw Appointment List
	getAll: (params?: Record<string, unknown>) =>
		apiClient.get<ApiResponse<AppointmentRow[]>>(
			API_ENDPOINTS.APPOINTMENT.LIST,
			{ params },
		),

	getByPatient: (patientId: string, params: AppointmentListParams) =>
		apiClient.get<ApiResponse<AppointmentPage>>(
			API_ENDPOINTS.APPOINTMENT.BY_PATIENT(patientId),
			{ params },
		),

	getById: (id: string) =>
		apiClient.get<ApiResponse<Appointment>>(
			API_ENDPOINTS.APPOINTMENT.DETAIL(id),
		),

	findAvailability: async (
		request: AppointmentAvailabilityRequest,
	): Promise<AppointmentAvailabilityResponse> => {
		const { data } = await apiClient.get<AppointmentAvailabilityResponse>(
			API_ENDPOINTS.APPOINTMENT.AVAILABILITY,
			{ params: request },
		);
		return data;
	},

	update: (id: string, request: UpdateAppointmentRequest) =>
		apiClient.put<ApiResponse<Appointment>>(
			API_ENDPOINTS.APPOINTMENT.UPDATE(id),
			request,
		),

	cancel: (id: string, request: CancelAppointmentRequest) =>
		apiClient.post<ApiResponse<Appointment>>(
			API_ENDPOINTS.APPOINTMENT.CANCEL(id),
			request,
		),

	confirm: (id: string) =>
		apiClient.post<ApiResponse<Appointment>>(
			API_ENDPOINTS.APPOINTMENT.CONFIRM(id),
		),

	sendReminder: ({ appointmentId, ...request }: SendReminderRequest) =>
		apiClient.post(
			API_ENDPOINTS.APPOINTMENT.SEND_REMINDER(appointmentId),
			request,
		),

	createPayment: (request: CreatePaymentRequest) =>
		apiClient.post<ApiResponse<{ paymentUrl: string }>>(
			API_ENDPOINTS.VNPAY.CREATE_PAYMENT,
			request,
		),

	getPaymentsByAppointment: (appointmentId: string) =>
		apiClient.get<ApiResponse<Payment[]>>(
			API_ENDPOINTS.PAYMENT.BY_APPOINTMENT(appointmentId),
		),

	refundPayment: (paymentId: string, request: RefundPaymentRequest) =>
		apiClient.post<ApiResponse<Payment>>(
			API_ENDPOINTS.PAYMENT.REFUND(paymentId),
			request,
		),
};
