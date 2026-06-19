// ============================================================
// User roles — mirrors backend RBAC
// ============================================================

import type { UserRole } from "@/shared/types";

export const ROLES: Record<UserRole, UserRole> = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  DENTIST: "DENTIST",
  RECEPTIONIST: "RECEPTIONIST",
  NURSE: "NURSE",
  CLINIC_ADMIN: "CLINIC_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  PATIENT: "Patient",
  DENTIST: "Dentist",
  RECEPTIONIST: "Receptionist",
  NURSE: "Nurse",
  CLINIC_ADMIN: "Clinic Admin",
  SUPER_ADMIN: "Super Admin",
} as const;

/** Roles that can access the admin panel */
export const ADMIN_ROLES: UserRole[] = ["ADMIN", "CLINIC_ADMIN", "SUPER_ADMIN"];

/** Roles that can access clinical features */
export const CLINICAL_ROLES: UserRole[] = ["DENTIST", "CLINIC_ADMIN"];

/** Roles that are staff (not patients) */
export const STAFF_ROLES: UserRole[] = [
  "DENTIST",
  "RECEPTIONIST",
  "NURSE",
  "ADMIN",
  "CLINIC_ADMIN",
  "SUPER_ADMIN",
];
