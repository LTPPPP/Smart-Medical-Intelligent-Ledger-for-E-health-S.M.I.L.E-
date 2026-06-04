// ============================================================
// Role-based navigation configuration
// ============================================================

import { ROUTES } from "@/shared/constants/routes";
import type { NavItem, UserRole } from "@/shared/types";

/** Main navigation items — filtered by user role at runtime */
export const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    i18nKey: "nav.dashboard",
    href: ROUTES.DASHBOARD,
    icon: "lucide:layout-dashboard",
  },
  {
    title: "Appointments",
    i18nKey: "nav.appointments",
    href: ROUTES.APPOINTMENTS,
    icon: "lucide:calendar",
    roles: ["PATIENT", "DENTIST", "RECEPTIONIST", "NURSE", "CLINIC_ADMIN"],
  },
  {
    title: "Patients",
    i18nKey: "nav.patients",
    href: ROUTES.PATIENTS,
    icon: "lucide:users",
    roles: ["DENTIST", "RECEPTIONIST", "CLINIC_ADMIN"],
  },
  {
    title: "Internal Notes",
    i18nKey: "nav.internalNotes",
    href: ROUTES.INTERNAL_NOTES,
    icon: "lucide:pen-square",
    roles: ["DENTIST", "CLINIC_ADMIN"],
  },
  {
    title: "Examinations",
    i18nKey: "nav.examinations",
    href: ROUTES.EXAMINATIONS,
    icon: "lucide:stethoscope",
    roles: ["DENTIST", "CLINIC_ADMIN"],
  },
  {
    title: "Records",
    i18nKey: "nav.records",
    href: ROUTES.RECORDS,
    icon: "lucide:file-text",
    roles: ["PATIENT", "DENTIST", "RECEPTIONIST", "CLINIC_ADMIN"],
  },
  {
    title: "Payments",
    i18nKey: "nav.payments",
    href: ROUTES.PAYMENTS,
    icon: "lucide:credit-card",
    roles: ["PATIENT", "RECEPTIONIST", "CLINIC_ADMIN"],
  },
  {
    title: "Users",
    i18nKey: "nav.users",
    href: ROUTES.ADMIN_USERS,
    icon: "lucide:shield",
    roles: ["CLINIC_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Clinics",
    i18nKey: "nav.clinics",
    href: ROUTES.ADMIN_CLINICS,
    icon: "lucide:building-2",
    roles: ["CLINIC_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Audit Logs",
    i18nKey: "nav.auditLogs",
    href: ROUTES.ADMIN_AUDIT_LOGS,
    icon: "lucide:scroll-text",
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Profile",
    i18nKey: "nav.profile",
    href: ROUTES.PROFILE,
    icon: "lucide:user-circle",
  },
  {
    title: "Settings",
    i18nKey: "nav.settings",
    href: ROUTES.SETTINGS,
    icon: "lucide:settings",
  },
  {
    title: "Connection Test",
    i18nKey: "nav.test",
    href: ROUTES.TEST,
    icon: "lucide:flask-conical",
    roles: ["CLINIC_ADMIN", "SUPER_ADMIN"],
  },
];

/**
 * Filter navigation items based on user role.
 * Items without a `roles` array are visible to all authenticated users.
 */
export function getNavigationForRole(role: UserRole): NavItem[] {
  return NAVIGATION_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
}
