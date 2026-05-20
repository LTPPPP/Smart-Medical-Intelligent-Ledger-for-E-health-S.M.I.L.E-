// ============================================================
// TanStack Query key factory — ensures consistent cache keys
// See: https://tkdodo.eu/blog/effective-react-query-keys
// ============================================================

import type { AppointmentFilters, PatientFilters, SearchParams } from "@/shared/types";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (filters: PatientFilters) => [...patientKeys.lists(), filters] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
};

export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: AppointmentFilters) =>
    [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  slots: (params: { dentistId: string; date: string }) =>
    [...appointmentKeys.all, "slots", params] as const,
};

export const examinationKeys = {
  all: ["examinations"] as const,
  lists: () => [...examinationKeys.all, "list"] as const,
  list: (filters: SearchParams) =>
    [...examinationKeys.lists(), filters] as const,
  details: () => [...examinationKeys.all, "detail"] as const,
  detail: (id: string) => [...examinationKeys.details(), id] as const,
};

export const prescriptionKeys = {
  all: ["prescriptions"] as const,
  lists: () => [...prescriptionKeys.all, "list"] as const,
  list: (filters: SearchParams) =>
    [...prescriptionKeys.lists(), filters] as const,
  detail: (id: string) => [...prescriptionKeys.all, "detail", id] as const,
};

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters: SearchParams) => [...paymentKeys.lists(), filters] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: SearchParams) =>
    [...notificationKeys.lists(), filters] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
};

export const adminKeys = {
  clinics: {
    all: ["admin", "clinics"] as const,
    list: (filters: SearchParams) =>
      ["admin", "clinics", "list", filters] as const,
    detail: (id: string) => ["admin", "clinics", "detail", id] as const,
  },
  auditLogs: {
    all: ["admin", "audit-logs"] as const,
    list: (filters: SearchParams) =>
      ["admin", "audit-logs", "list", filters] as const,
  },
};
