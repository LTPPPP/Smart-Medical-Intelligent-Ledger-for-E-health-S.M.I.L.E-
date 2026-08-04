// Role Access Groups

import type { UserRole } from "@/shared/types";

/** Normalize Role */
export const normalizeRole = (role: string): string =>
	role
		.trim()
		.replace(/^ROLE_/i, "")
		.toUpperCase();

export function hasAnyRole(
	userRoles: readonly string[] | undefined,
	requiredRoles: readonly string[],
): boolean {
	const normalizedUserRoles = new Set((userRoles ?? []).map(normalizeRole));
	return requiredRoles.some((role) =>
		normalizedUserRoles.has(normalizeRole(role)),
	);
}

export const ROLE: Record<UserRole, UserRole> = {
	ADMIN: "ADMIN",
	DOCTOR: "DOCTOR",
	PATIENT: "PATIENT",
	RECEPTIONIST: "RECEPTIONIST",
	NURSE: "NURSE",
	MANAGER: "MANAGER",
};

/** Admin Panel */
export const ADMIN_ROLES: UserRole[] = [ROLE.ADMIN];

/** Examination Roles */
export const EXAMINATION_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.NURSE,
	ROLE.MANAGER,
];

/** Examination Create Roles */
export const EXAMINATION_CREATE_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.MANAGER,
];

/** Patient Directory Roles */
export const PATIENT_DIRECTORY_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.RECEPTIONIST,
	ROLE.NURSE,
	ROLE.MANAGER,
];

/** Dental Image Roles */
export const DENTAL_IMAGE_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.NURSE,
	ROLE.MANAGER,
];

/** My Schedule Roles */
export const MY_SCHEDULE_ROLES: UserRole[] = [ROLE.DOCTOR, ROLE.NURSE];

/** Schedule Management Roles */
export const SCHEDULE_MANAGEMENT_ROLES: UserRole[] = [ROLE.ADMIN, ROLE.MANAGER];

/** Leave Roles */
export const LEAVES_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.RECEPTIONIST,
	ROLE.MANAGER,
];

/** Front Desk Roles */
export const FRONT_DESK_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.RECEPTIONIST,
	ROLE.NURSE,
	ROLE.MANAGER,
];

/** Appointment Edit Roles */
export const APPOINTMENT_EDIT_ROLES: UserRole[] = [ROLE.RECEPTIONIST, ROLE.PATIENT];

/** Work Shift Roles */
export const WORK_SHIFT_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.MANAGER,
];

/** Schedule Hub Roles */
export const SCHEDULE_HUB_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.RECEPTIONIST,
	ROLE.MANAGER,
];

/** Clinic Management Roles */
export const CLINIC_MANAGEMENT_ROLES: UserRole[] = [ROLE.ADMIN, ROLE.MANAGER];

/** Booking Roles */
export const BOOKING_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.DOCTOR,
	ROLE.RECEPTIONIST,
	ROLE.PATIENT,
];

/** Patient Registration Roles */
export const PATIENT_REGISTRATION_ROLES: UserRole[] = [
	ROLE.MANAGER,
	ROLE.RECEPTIONIST,
];

/** Payment Roles */
export const PAYMENT_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.MANAGER,
	ROLE.RECEPTIONIST,
	ROLE.PATIENT,
];

/** Booking Unblock Roles */
export const PATIENT_BOOKING_UNBLOCK_ROLES: UserRole[] = [
	ROLE.ADMIN,
	ROLE.MANAGER,
];
