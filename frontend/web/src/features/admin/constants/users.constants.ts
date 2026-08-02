import { GENDER, GENDER_LABELS } from "@/shared/constants/common";
import { ROLE } from "@/shared/constants/roles";

// Gender Filter Options
export const GENDER_OPTIONS = [
	{ value: "", label: "All Genders" },
	{ value: String(GENDER.MALE), label: GENDER_LABELS[GENDER.MALE] },
	{ value: String(GENDER.FEMALE), label: GENDER_LABELS[GENDER.FEMALE] },
	{ value: String(GENDER.UNKNOWN), label: GENDER_LABELS[GENDER.UNKNOWN] },
] as const;

// Role Filter Options
export const ROLE_OPTIONS = [
	{ value: "", label: "All Roles" },
	{ value: ROLE.ADMIN, label: "Admin" },
	{ value: ROLE.DOCTOR, label: "Doctor" },
	{ value: ROLE.NURSE, label: "Nurse" },
	{ value: ROLE.RECEPTIONIST, label: "Receptionist" },
	{ value: ROLE.MANAGER, label: "Manager" },
	{ value: ROLE.PATIENT, label: "Patient" },
] as const;
