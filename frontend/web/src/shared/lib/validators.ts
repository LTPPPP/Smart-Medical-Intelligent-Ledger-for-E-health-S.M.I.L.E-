// ============================================================
// Shared Zod validation schemas
//
// Every bounded field is capped at its real database width via FIELD_LIMITS, and
// every enum-backed field is validated against the same value set the backend
// enum defines. A payload that satisfies these schemas cannot be rejected by the
// API for an out-of-range value, nor by PostgreSQL for an over-long one.
//
// Each schema here backs a form that actually calls it — see the `safeParse`
// calls in RegisterForm, PatientForm and RoomModal. Schemas are not added
// speculatively; add one when the form that needs it exists.
// ============================================================

import { z } from "zod";

import { isGenderCode } from "@/shared/constants/common";
import { FIELD_LIMITS } from "@/shared/constants/field-limits";

// ─── Reusable field schemas ──────────────────────────────────

/** Trims, then enforces the column width. */
const optionalText = (max: number) =>
	z.string().trim().max(max, `Cannot exceed ${max} characters`).optional();

const requiredText = (max: number, label: string) =>
	z
		.string()
		.trim()
		.min(1, `${label} is required`)
		.max(max, `${label} cannot exceed ${max} characters`);

const emailField = z
	.string()
	.trim()
	.max(
		FIELD_LIMITS.email,
		`Email cannot exceed ${FIELD_LIMITS.email} characters`,
	)
	.email("Invalid email address");

/** E.164 allows at most 15 digits; the column holds 20 to leave room for formatting. */
const phoneField = z
	.string()
	.trim()
	.max(
		FIELD_LIMITS.phone,
		`Phone cannot exceed ${FIELD_LIMITS.phone} characters`,
	)
	.regex(/^[0-9+\-() ]{8,20}$/, "Invalid phone number");

/** bcrypt hashes only the first 72 bytes, so anything longer is silently cut. */
const passwordField = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(
		FIELD_LIMITS.password,
		`Password cannot exceed ${FIELD_LIMITS.password} characters`,
	);

/** ISO 5218 code: 0 unknown, 1 male, 2 female. Accepts what a <select> yields. */
const genderField = z.coerce
	.number()
	.refine(isGenderCode, "Select a valid gender");

/** firstName + lastName are joined into full_name, so each takes half the width. */
export const HALF_FULL_NAME = Math.floor(FIELD_LIMITS.fullName / 2);

// ─── Enum schemas — mirror the backend enums exactly ─────────

export const roomTypeSchema = z.enum(["examination", "surgery", "imaging"]);
export const roomStatusSchema = z.enum([
	"AVAILABLE",
	"OCCUPIED",
	"MAINTENANCE",
]);

// ─── Auth ────────────────────────────────────────────────────

export const loginSchema = z.object({
	email: emailField.min(1, "Email is required"),
	password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
	email: emailField.min(1, "Email is required"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/** Backs RegisterForm — field names match that component's state exactly. */
export const registerFormSchema = z
	.object({
		firstName: requiredText(HALF_FULL_NAME, "First name"),
		lastName: requiredText(HALF_FULL_NAME, "Last name"),
		username: requiredText(FIELD_LIMITS.username, "Username")
			.min(3, "Min. 3 characters")
			.regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
		email: emailField.min(1, "Email is required"),
		phone: z.union([z.literal(""), phoneField]),
		gender: genderField,
		password: passwordField,
		confirmPassword: z.string().min(1, "Confirm password is required"),
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	})
	.refine(
		(d) =>
			`${d.firstName} ${d.lastName}`.trim().length <= FIELD_LIMITS.fullName,
		{
			message: `Full name cannot exceed ${FIELD_LIMITS.fullName} characters`,
			path: ["lastName"],
		},
	);

export type RegisterFormData = z.infer<typeof registerFormSchema>;

// ─── Patient ─────────────────────────────────────────────────

/** Backs PatientForm — field names match that component's FormData exactly. */
export const patientFormSchema = z.object({
	full_name: requiredText(FIELD_LIMITS.fullName, "Full name"),
	date_of_birth: z.string().trim().min(1, "Date of birth is required"),
	gender: genderField,
	phone: requiredText(FIELD_LIMITS.phone, "Phone number").regex(
		/^[0-9+\-() ]{8,20}$/,
		"Invalid phone number",
	),
	email: z.union([z.literal(""), emailField]),
	address: optionalText(FIELD_LIMITS.address),
	insurance_number: optionalText(FIELD_LIMITS.insuranceNumber),
	insurance_provider: optionalText(FIELD_LIMITS.insuranceProvider),
	emergency_contact_name: optionalText(FIELD_LIMITS.emergencyContact),
	emergency_contact_phone: z.union([z.literal(""), phoneField]),
	emergency_contact_relationship: optionalText(FIELD_LIMITS.relationship),
	allergies_raw: optionalText(FIELD_LIMITS.notes),
});

export type PatientFormData = z.infer<typeof patientFormSchema>;

// ─── Clinic rooms ────────────────────────────────────────────

/** Backs RoomModal. room_type is a real Postgres enum, so it must be valid. */
export const roomFormSchema = z.object({
	room_name: requiredText(FIELD_LIMITS.roomName, "Room name"),
	room_code: requiredText(FIELD_LIMITS.roomCode, "Room code"),
	room_type: roomTypeSchema,
	status: roomStatusSchema.optional(),
	floor_number: z.coerce.number().int().min(0).nullable().optional(),
	capacity: z.coerce.number().int().positive().nullable().optional(),
});

export type RoomFormData = z.infer<typeof roomFormSchema>;

// ─── Helper ──────────────────────────────────────────────────

/**
 * Runs a schema and returns flat `{ field: message }` errors, which is the shape
 * the existing forms already keep in their `errors` state.
 */
export function collectErrors<T extends z.ZodTypeAny>(
	schema: T,
	value: unknown,
): Record<string, string> {
	const result = schema.safeParse(value);
	if (result.success) return {};
	const errors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const key = String(issue.path[0] ?? "_");
		if (!errors[key]) errors[key] = issue.message;
	}
	return errors;
}
