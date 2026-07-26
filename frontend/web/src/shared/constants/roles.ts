// ============================================================
// Role-based access groups — single source of truth for page/route
// guards (ProtectedRoute requiredRoles). Mirrors the backend RoleEnum
// exactly: ADMIN, DOCTOR, PATIENT, RECEPTIONIST, NURSE, MANAGER — see
// clinical-emr-service/src/auth/roles/roles.enum.ts. Do not add roles
// here that don't exist on the backend.
// ============================================================

import type { UserRole } from "@/shared/types";

export const ROLE: Record<UserRole, UserRole> = {
	ADMIN: "ADMIN",
	DOCTOR: "DOCTOR",
	PATIENT: "PATIENT",
	RECEPTIONIST: "RECEPTIONIST",
	NURSE: "NURSE",
	MANAGER: "MANAGER",
};

/** Admin panel (/admin/*). */
export const ADMIN_ROLES: UserRole[] = [ROLE.ADMIN];

/** Examinations — clinical PHI; a PATIENT/RECEPTIONIST must never reach these (main_flow.md J2). */
export const EXAMINATION_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.NURSE,
	ROLE.MANAGER,
];

/** Patient directory — PHI; a PATIENT must never reach it (J2 / patients.controller.ts). */
export const PATIENT_DIRECTORY_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.RECEPTIONIST,
	ROLE.NURSE,
	ROLE.MANAGER,
];

/** Dental images/X-rays — clinical PHI (J2). */
export const DENTAL_IMAGE_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.NURSE,
	ROLE.MANAGER,
];

/** Doctor's own performance view — distinct from /admin/performance, gated separately (J2). */
export const PERFORMANCE_ROLES: UserRole[] = [ROLE.DOCTOR];

/** B4.8: a doctor only ever sees their own schedule here (J2). */
export const MY_SCHEDULE_ROLES: UserRole[] = [ROLE.DOCTOR];

/** Doctor schedule management (create/edit shifts for any doctor) — Admin + clinic Manager (J2). */
export const SCHEDULE_MANAGEMENT_ROLES: UserRole[] = [ROLE.ADMIN, ROLE.MANAGER];

/** Leave requests/approvals — staff-only; a PATIENT must not reach this (J2). */
export const LEAVES_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.RECEPTIONIST,
	ROLE.NURSE,
	ROLE.MANAGER,
];

/** Front-desk actions (appointment check-in) — mirrors isPrivilegedStaffRole in appointments.service.ts. */
export const FRONT_DESK_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.RECEPTIONIST,
	ROLE.NURSE,
	ROLE.MANAGER,
];

/** Work-shift catalog management — mirrors write roles in work-shifts.controller.ts. */
export const WORK_SHIFT_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.RECEPTIONIST,
	ROLE.MANAGER,
];
