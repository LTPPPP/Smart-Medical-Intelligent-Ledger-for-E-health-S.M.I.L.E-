export enum AppointmentStatus {
	SCHEDULED = "scheduled",
	CONFIRMED = "confirmed",
	COMPLETED = "completed",
	CANCELLED = "cancelled",
	NO_SHOW = "no_show",
}

export const BOOKING_TYPE = {
	CLINIC: "CLINIC",
	SPECIALTY: "SPECIALTY",
	DOCTOR: "DOCTOR",
	OUTSIDE_HOURS: "OUTSIDE_HOURS",
} as const;

export type BookingType = (typeof BOOKING_TYPE)[keyof typeof BOOKING_TYPE];

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
	scheduled: "bg-blue-100 text-blue-800",
	confirmed: "bg-green-100 text-green-800",
	completed: "bg-gray-100 text-gray-800",
	cancelled: "bg-red-100 text-red-800",
	no_show: "bg-orange-100 text-orange-800",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800",
	paid: "bg-green-100 text-green-800",
	refunded: "bg-purple-100 text-purple-800",
	failed: "bg-red-100 text-red-800",
};

export const CANCELLATION_POLICY = {
	FREE_CANCELLATION_HOURS: 24,
	LATE_CANCELLATION_FEE_PERCENT: 30,
};
