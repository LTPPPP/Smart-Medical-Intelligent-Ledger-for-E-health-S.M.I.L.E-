// ============================================================
// Role-aware navigation + dashboard kind resolution
// Drives the unified AppShell sidebar and /dashboard routing.
// ============================================================

import { normalizeRole } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";

export type DashboardKind =
	| "admin"
	| "manager"
	| "doctor"
	| "receptionist"
	| "nurse"
	| "patient";

export interface NavItem {
	/** Translation key resolved via useTranslation()'s t() — see @/features/i18n. */
	label: string;
	href: string;
	icon: string;
	children?: NavItem[];
}

const KYC_STAFF_ROLES = new Set([
	"ADMIN",
	"MANAGER",
	"DOCTOR",
	"RECEPTIONIST",
	"NURSE",
]);

/**
 * Resolve the primary dashboard kind for a set of roles.
 * Priority: admin > manager > doctor > receptionist > nurse > patient (most-privileged wins).
 */
export function resolveDashboardKind(roles?: string[]): DashboardKind {
	const set = new Set((roles ?? []).map(normalizeRole));
	if (set.has("ADMIN") || set.has("SUPER_ADMIN") || set.has("CLINIC_ADMIN"))
		return "admin";
	if (set.has("MANAGER")) return "manager";
	if (set.has("DOCTOR") || set.has("DENTIST")) return "doctor";
	if (set.has("RECEPTIONIST")) return "receptionist";
	if (set.has("NURSE")) return "nurse";
	return "patient";
}

export function requiresStaffKyc(roles?: string[]): boolean {
	return (roles ?? []).some((role) => KYC_STAFF_ROLES.has(normalizeRole(role)));
}

// Nav building blocks — label is a "nav.*" key resolved via t() at render time.
const NAV_DASHBOARD: NavItem = {
	label: "nav.dashboard",
	href: ROUTES.DASHBOARD,
	icon: "lucide:layout-dashboard",
};
const NAV_APPOINTMENTS: NavItem = {
	label: "nav.appointments",
	href: ROUTES.APPOINTMENTS,
	icon: "lucide:calendar-clock",
};
const NAV_PATIENTS: NavItem = {
	label: "nav.patients",
	href: ROUTES.PATIENTS,
	icon: "lucide:users",
};
const NAV_IMAGING: NavItem = {
	label: "nav.imaging",
	href: "/dental-images",
	icon: "lucide:scan",
};
const NAV_CLINICS: NavItem = {
	label: "nav.clinics",
	href: ROUTES.CLINICS,
	icon: "lucide:building-2",
};
const NAV_SPECIALTIES: NavItem = {
	label: "nav.specialties",
	href: ROUTES.SPECIALTIES,
	icon: "lucide:stethoscope",
};
const NAV_SCHEDULES: NavItem = {
	label: "nav.schedules",
	href: ROUTES.SCHEDULES,
	icon: "lucide:calendar-days",
};
const NAV_MY_SCHEDULE: NavItem = {
	label: "nav.mySchedule",
	href: ROUTES.MY_SCHEDULE,
	icon: "lucide:calendar-days",
};
const NAV_EXAMINATIONS: NavItem = {
	label: "nav.examinations",
	href: ROUTES.EXAMINATIONS,
	icon: "lucide:clipboard-plus",
};
const NAV_PRESCRIPTIONS: NavItem = {
	label: "nav.prescriptions",
	href: ROUTES.PRESCRIPTIONS,
	icon: "lucide:pill",
};
const NAV_REVENUE: NavItem = {
	label: "nav.revenue",
	href: ROUTES.ADMIN_REVENUE,
	icon: "lucide:bar-chart-3",
};
const NAV_PERFORMANCE_ADMIN: NavItem = {
	label: "nav.performance",
	href: "/admin/performance",
	icon: "lucide:gauge",
};
// Flatten nav
const NAV_USER_MANAGEMENT: NavItem = {
	label: "nav.userManagement",
	href: ROUTES.ADMIN_USERS,
	icon: "lucide:users",
};
const NAV_KYC_MANAGEMENT: NavItem = {
	label: "nav.kycManagement",
	href: ROUTES.ADMIN_KYC,
	icon: "lucide:id-card",
};
const NAV_REFUNDS: NavItem = {
	label: "nav.refunds",
	href: ROUTES.ADMIN_REFUNDS,
	icon: "lucide:banknote",
};
const NAV_ROLE_MANAGEMENT: NavItem = {
	label: "nav.roleManagement",
	href: ROUTES.ADMIN_ROLES,
	icon: "lucide:shield-half",
};
const NAV_AUDIT_LOGS: NavItem = {
	label: "nav.auditLogs",
	href: ROUTES.ADMIN_AUDIT_LOGS,
	icon: "lucide:scroll-text",
};
const NAV_CLINICS_PUBLIC: NavItem = {
	label: "nav.clinics",
	href: ROUTES.CLINICS,
	icon: "lucide:hospital",
};

/** Sidebar nav tailored to each role. */
export function navForKind(kind: DashboardKind): NavItem[] {
	switch (kind) {
		case "admin":
			return [
				NAV_DASHBOARD,
				NAV_APPOINTMENTS,
				NAV_PATIENTS,
				NAV_IMAGING,
				NAV_CLINICS,
				NAV_SPECIALTIES,
				NAV_SCHEDULES,
				NAV_EXAMINATIONS,
				NAV_REVENUE,
				NAV_PERFORMANCE_ADMIN,
				NAV_USER_MANAGEMENT,
				NAV_KYC_MANAGEMENT,
				NAV_REFUNDS,
				NAV_ROLE_MANAGEMENT,
				NAV_AUDIT_LOGS,
			];
		case "manager":
			// Clinic manager — operational reach. Revenue/Performance live under /admin/*
			// (ADMIN_ROLES-gated), so they're omitted here to avoid dead links.
			return [
				NAV_DASHBOARD,
				NAV_APPOINTMENTS,
				NAV_PATIENTS,
				NAV_IMAGING,
				NAV_CLINICS,
				NAV_SPECIALTIES,
				NAV_SCHEDULES,
				NAV_EXAMINATIONS,
			];
		case "doctor":
			return [
				NAV_DASHBOARD,
				NAV_APPOINTMENTS,
				NAV_PATIENTS,
				NAV_IMAGING,
				NAV_EXAMINATIONS,
				NAV_MY_SCHEDULE,
			];
		case "receptionist":
			return [
				NAV_DASHBOARD,
				NAV_APPOINTMENTS,
				NAV_PATIENTS,
				NAV_CLINICS,
				NAV_SCHEDULES,
			];
		case "nurse":
			return [
				NAV_DASHBOARD,
				NAV_APPOINTMENTS,
				NAV_PATIENTS,
				NAV_IMAGING,
				NAV_EXAMINATIONS,
				NAV_SPECIALTIES,
				NAV_MY_SCHEDULE,
			];
		case "patient":
		default:
			return [
				NAV_DASHBOARD,
				NAV_APPOINTMENTS,
				NAV_CLINICS_PUBLIC,
				NAV_PRESCRIPTIONS,
			];
	}
}
