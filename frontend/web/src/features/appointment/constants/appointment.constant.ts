export const APPOINTMENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const BOOKING_TYPE = {
  CLINIC: 'clinic',
  SPECIALTY: 'specialty',
  DOCTOR: 'doctor',
  OUTSIDE_HOURS: 'outside-hours',
} as const;

export type BookingType = typeof BOOKING_TYPE[keyof typeof BOOKING_TYPE];

// Status badge colors
export const APPOINTMENT_STATUS_COLORS = {
  [APPOINTMENT_STATUS.SCHEDULED]: 'bg-blue-100 text-blue-800',
  [APPOINTMENT_STATUS.CONFIRMED]: 'bg-green-100 text-green-800',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [APPOINTMENT_STATUS.COMPLETED]: 'bg-gray-100 text-gray-800',
  [APPOINTMENT_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [APPOINTMENT_STATUS.NO_SHOW]: 'bg-orange-100 text-orange-800',
} as const;

export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PAYMENT_STATUS.PAID]: 'bg-green-100 text-green-800',
  [PAYMENT_STATUS.FAILED]: 'bg-red-100 text-red-800',
  [PAYMENT_STATUS.REFUNDED]: 'bg-gray-100 text-gray-800',
} as const;

// Time slots
export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
] as const;

export const EMERGENCY_TIME_SLOTS = [
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
] as const;

// Reminder channels
export const REMINDER_CHANNELS = ['EMAIL', 'SMS', 'PUSH'] as const;
export type ReminderChannel = typeof REMINDER_CHANNELS[number];

// Cancellation policy
export const CANCELLATION_POLICY = {
  FREE_CANCELLATION_HOURS: 2,
  LATE_CANCELLATION_FEE_PERCENT: 50,
} as const;