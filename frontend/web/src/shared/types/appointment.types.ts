// ============================================================
// Appointment-related types
// ============================================================

import type { DateString, ID, SearchParams } from "./common.types";

/** Appointment status */
export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

/** Appointment entity */
export interface Appointment {
  id: ID;
  patientId: ID;
  dentistId: ID;
  clinicId: ID;
  slotId: ID;
  serviceId: ID;
  status: AppointmentStatus;
  notes?: string;
  scheduledAt: DateString;
  startTime: DateString;
  endTime: DateString;
  createdAt: DateString;
  updatedAt: DateString;
  // Populated relations
  patientName?: string;
  dentistName?: string;
  serviceName?: string;
  clinicName?: string;
}

/** Available time slot */
export interface TimeSlot {
  id: ID;
  dentistId: ID;
  clinicId: ID;
  startTime: DateString;
  endTime: DateString;
  isAvailable: boolean;
}

/** Appointment filter params */
export interface AppointmentFilters extends SearchParams {
  status?: AppointmentStatus;
  dentistId?: ID;
  patientId?: ID;
  clinicId?: ID;
  dateFrom?: DateString;
  dateTo?: DateString;
}

/** Create appointment request */
export interface CreateAppointmentRequest {
  patientId: ID;
  dentistId: ID;
  clinicId: ID;
  slotId: ID;
  serviceId: ID;
  notes?: string;
}
