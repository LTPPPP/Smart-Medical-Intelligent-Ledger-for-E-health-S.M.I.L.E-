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
    icon: "lucide:calendar-clock",
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
    title: "Schedule",
    i18nKey: "nav.schedule",
    href: ROUTES.SCHEDULES,
    icon: "lucide:calendar-days",
    roles: ["DENTIST", "CLINIC_ADMIN"],
  },
  {
    title: "Services",
    i18nKey: "nav.services",
    href: ROUTES.SERVICES,
    icon: "lucide:briefcase-medical",
  },
  {
    title: "Examinations",
    i18nKey: "nav.examinations",
    href: ROUTES.EXAMINATIONS,
    icon: "lucide:stethoscope",
    roles: ["DENTIST", "CLINIC_ADMIN"],
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
    href: ROUTES.CLINICS,
    icon: "lucide:building-2",
  },
  {
    title: "Profile",
    i18nKey: "nav.profile",
    href: ROUTES.PROFILE,
    icon: "lucide:user-circle",
  },
];

/**
 * Filter navigation items based on user role.
 * Items without a `roles` array are visible to all authenticated users.
 */
export function getNavigationForRole(role: UserRole): NavItem[] {
  const normalizedRole = role.replace(/^ROLE_/, "") as UserRole;
  return NAVIGATION_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(normalizedRole),
  );
}
