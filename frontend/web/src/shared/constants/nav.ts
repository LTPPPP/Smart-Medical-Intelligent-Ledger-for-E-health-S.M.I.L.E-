// ============================================================
// Role-aware navigation + dashboard kind resolution
// Drives the unified AppShell sidebar and /dashboard routing.
// ============================================================

import { ROUTES } from "@/shared/constants/routes";

export type DashboardKind = "admin" | "manager" | "doctor" | "receptionist" | "nurse" | "patient";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

// Normalize a backend role string ("ROLE_DOCTOR", "DOCTOR", "Dentist") to an
// uppercase bare token so matching is resilient to backend variations.
const normalizeRole = (r: string): string =>
  r.replace(/^ROLE_/i, "").trim().toUpperCase();

/**
 * Resolve the primary dashboard kind for a set of roles.
 * Priority: admin > manager > doctor > receptionist > nurse > patient (most-privileged wins).
 */
export function resolveDashboardKind(roles?: string[]): DashboardKind {
  const set = new Set((roles ?? []).map(normalizeRole));
  if (set.has("ADMIN") || set.has("SUPER_ADMIN") || set.has("CLINIC_ADMIN")) return "admin";
  if (set.has("MANAGER")) return "manager";
  if (set.has("DOCTOR") || set.has("DENTIST")) return "doctor";
  if (set.has("RECEPTIONIST")) return "receptionist";
  if (set.has("NURSE")) return "nurse";
  return "patient";
}

// Nav building blocks
const NAV_DASHBOARD: NavItem = { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "lucide:layout-dashboard" };
const NAV_APPOINTMENTS: NavItem = { label: "Appointments", href: ROUTES.APPOINTMENTS, icon: "lucide:calendar-clock" };
const NAV_PATIENTS: NavItem = { label: "Patients", href: ROUTES.PATIENTS, icon: "lucide:users" };
const NAV_IMAGING: NavItem = { label: "Imaging", href: "/dental-images", icon: "lucide:scan" };
const NAV_CLINICS: NavItem = { label: "Clinics", href: ROUTES.CLINICS, icon: "lucide:building-2" };
const NAV_SPECIALTIES: NavItem = { label: "Specialties", href: ROUTES.SPECIALTIES, icon: "lucide:stethoscope" };
const NAV_SCHEDULES: NavItem = { label: "Schedules", href: ROUTES.SCHEDULES, icon: "lucide:calendar-days" };
const NAV_MY_SCHEDULE: NavItem = { label: "My Schedule", href: ROUTES.MY_SCHEDULE, icon: "lucide:calendar-days" };
const NAV_EXAMINATIONS: NavItem = { label: "Examinations", href: ROUTES.EXAMINATIONS, icon: "lucide:clipboard-plus" };
const NAV_REVENUE: NavItem = { label: "Revenue", href: ROUTES.ADMIN_REVENUE, icon: "lucide:bar-chart-3" };
const NAV_PERFORMANCE: NavItem = { label: "Performance", href: "/performance", icon: "lucide:gauge" };
const NAV_PERFORMANCE_ADMIN: NavItem = { label: "Performance", href: "/admin/performance", icon: "lucide:gauge" };
const NAV_ADMIN: NavItem = {
  label: "Admin Panel",
  href: ROUTES.ADMIN,
  icon: "lucide:shield-check",
  children: [
    { label: "Overview", href: ROUTES.ADMIN, icon: "lucide:layout-grid" },
    { label: "User Management", href: ROUTES.ADMIN_USERS, icon: "lucide:users" },
    { label: "KYC Management", href: ROUTES.ADMIN_KYC, icon: "lucide:id-card" },
    { label: "Refunds", href: ROUTES.ADMIN_REFUNDS, icon: "lucide:banknote" },
    { label: "Facility & Schedule", href: ROUTES.ADMIN_FACILITY, icon: "lucide:building-2" },
    { label: "Role Management", href: ROUTES.ADMIN_ROLES, icon: "lucide:shield-half" },
    { label: "Audit Logs", href: ROUTES.ADMIN_AUDIT_LOGS, icon: "lucide:scroll-text" },
  ],
};
const NAV_CLINICS_PUBLIC: NavItem = { label: "Find Clinics", href: ROUTES.CLINICS, icon: "lucide:hospital" };

/** Sidebar nav tailored to each role. */
export function navForKind(kind: DashboardKind): NavItem[] {
  switch (kind) {
    case "admin":
      return [
        NAV_DASHBOARD, NAV_APPOINTMENTS, NAV_PATIENTS, NAV_IMAGING, NAV_CLINICS,
        NAV_SPECIALTIES, NAV_SCHEDULES, NAV_EXAMINATIONS, NAV_REVENUE, NAV_PERFORMANCE_ADMIN,
        NAV_ADMIN,
      ];
    case "manager":
      // Clinic manager — operational reach. Revenue/Performance live under /admin/*
      // (ADMIN_ROLES-gated), so they're omitted here to avoid dead links.
      return [
        NAV_DASHBOARD, NAV_APPOINTMENTS, NAV_PATIENTS, NAV_IMAGING, NAV_CLINICS,
        NAV_SPECIALTIES, NAV_SCHEDULES, NAV_EXAMINATIONS,
      ];
    case "doctor":
      return [
        NAV_DASHBOARD, NAV_APPOINTMENTS, NAV_PATIENTS, NAV_IMAGING, NAV_EXAMINATIONS,
        NAV_MY_SCHEDULE, NAV_PERFORMANCE,
      ];
    case "receptionist":
      return [
        NAV_DASHBOARD, NAV_APPOINTMENTS, NAV_PATIENTS, NAV_CLINICS, NAV_SCHEDULES,
      ];
    case "nurse":
      return [
        NAV_DASHBOARD, NAV_APPOINTMENTS, NAV_PATIENTS, NAV_IMAGING,
      ];
    case "patient":
    default:
      return [
        NAV_DASHBOARD, NAV_APPOINTMENTS, NAV_CLINICS_PUBLIC,
      ];
  }
}
