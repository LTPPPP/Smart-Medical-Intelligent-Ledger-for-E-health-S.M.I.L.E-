// Role Aware Navigation

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

// Nav Building Blocks
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
// Combined Records View
const NAV_MY_MEDICAL_RECORDS: NavItem = {
	label: "nav.myMedicalRecords",
	href: ROUTES.MY_MEDICAL_RECORDS,
	icon: "lucide:clipboard-list",
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
const NAV_BOOKING_CHATBOT: NavItem = {
	label: "nav.bookingChatbot",
	href: ROUTES.ADMIN_BOOKING_CHATBOT,
	icon: "lucide:bot",
};

// /admin-Prefixed Twins — Same Page Content ("embedded" Mode, See
// clinics/specialties/examinations/schedules `page.tsx`), Kept Under
// admin/layout.tsx So Its AppShell Instance Doesn't Remount When Moving
// Between These Sidebar Items.
const NAV_ADMIN_CLINICS: NavItem = {
	label: "nav.clinics",
	href: ROUTES.ADMIN_CLINICS,
	icon: "lucide:building-2",
};
const NAV_ADMIN_SPECIALTIES: NavItem = {
	label: "nav.specialties",
	href: ROUTES.ADMIN_SPECIALTIES,
	icon: "lucide:stethoscope",
};
const NAV_ADMIN_EXAMINATIONS: NavItem = {
	label: "nav.examinations",
	href: ROUTES.ADMIN_EXAMINATIONS,
	icon: "lucide:clipboard-plus",
};
const NAV_ADMIN_SCHEDULES: NavItem = {
	label: "nav.schedules",
	href: ROUTES.ADMIN_SCHEDULES,
	icon: "lucide:calendar-days",
};

// Admin Nav Groups
const NAV_GROUP_OPERATIONS: NavItem = {
	label: "nav.groupOperations",
	href: ROUTES.APPOINTMENTS,
	icon: "lucide:layout-grid",
	children: [NAV_APPOINTMENTS, NAV_PATIENTS, NAV_IMAGING],
};
const NAV_GROUP_CLINIC: NavItem = {
	label: "nav.groupClinic",
	href: ROUTES.ADMIN_CLINICS,
	icon: "lucide:building-2",
	children: [
		NAV_ADMIN_CLINICS,
		NAV_ADMIN_SPECIALTIES,
		NAV_ADMIN_EXAMINATIONS,
		NAV_ADMIN_SCHEDULES,
	],
};
const NAV_GROUP_AI: NavItem = {
	label: "nav.groupAi",
	href: ROUTES.ADMIN_KYC,
	icon: "lucide:sparkles",
	children: [NAV_KYC_MANAGEMENT, NAV_BOOKING_CHATBOT],
};
const NAV_GROUP_SYSTEM: NavItem = {
	label: "nav.groupSystem",
	href: ROUTES.ADMIN_USERS,
	icon: "lucide:settings",
	children: [
		NAV_USER_MANAGEMENT,
		NAV_ROLE_MANAGEMENT,
		NAV_REFUNDS,
		NAV_AUDIT_LOGS,
	],
};
const NAV_GROUP_REPORTS: NavItem = {
	label: "nav.groupReports",
	href: ROUTES.ADMIN_REVENUE,
	icon: "lucide:bar-chart-3",
	children: [NAV_REVENUE, NAV_PERFORMANCE_ADMIN],
};

/** Sidebar nav tailored to each role. */
export function navForKind(kind: DashboardKind): NavItem[] {
	switch (kind) {
		case "admin":
			return [
				NAV_DASHBOARD,
				NAV_GROUP_OPERATIONS,
				NAV_GROUP_CLINIC,
				NAV_GROUP_AI,
				NAV_GROUP_SYSTEM,
				NAV_GROUP_REPORTS,
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
				NAV_MY_MEDICAL_RECORDS,
			];
	}
}
