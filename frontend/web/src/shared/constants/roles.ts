// ============================================================
// User roles — mirrors backend RBAC
// ============================================================

import type { UserRole } from "@/shared/types";

export const ROLES: Record<UserRole, UserRole> = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  DOCTOR: "DOCTOR",
  RECEPTIONIST: "RECEPTIONIST",
  NURSE: "NURSE",
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  RECEPTIONIST: "Receptionist",
  NURSE: "Nurse",
} as const;

/** Roles that can access the admin panel */
export const ADMIN_ROLES: UserRole[] = ["ADMIN"];

/** Roles that can access clinical features */
export const CLINICAL_ROLES: UserRole[] = ["DOCTOR"];

/** Roles that are staff (not patients) */
export const STAFF_ROLES: UserRole[] = ["DOCTOR", "RECEPTIONIST", "NURSE", "ADMIN"];
