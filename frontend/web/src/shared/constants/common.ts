/**
 * Gender codes following ISO/IEC 5218 — mirrors the backend `GenderEnum` and the
 * `smallint` gender column in both `users` and `patients`.
 *
 * ISO 5218 also defines 9 (not applicable); this system does not use it, so 0
 * covers both "not stated" and "other".
 */
export const GENDER = {
	UNKNOWN: 0,
	MALE: 1,
	FEMALE: 2,
} as const;

export type GENDER_TYPE = (typeof GENDER)[keyof typeof GENDER];

export const GENDER_LABELS: Record<GENDER_TYPE, string> = {
	[GENDER.UNKNOWN]: "Unknown",
	[GENDER.MALE]: "Male",
	[GENDER.FEMALE]: "Female",
};

export const GENDER_OPTIONS = [
	{ value: GENDER.MALE, label: GENDER_LABELS[GENDER.MALE] },
	{ value: GENDER.FEMALE, label: GENDER_LABELS[GENDER.FEMALE] },
	{ value: GENDER.UNKNOWN, label: GENDER_LABELS[GENDER.UNKNOWN] },
] as const;

/** True when `code` is one of the three codes the API accepts. */
export function isGenderCode(code: unknown): code is GENDER_TYPE {
	return (
		code === GENDER.UNKNOWN || code === GENDER.MALE || code === GENDER.FEMALE
	);
}

/**
 * Label for a gender code arriving from the API. Returns an em dash for null,
 * undefined, or any value outside the canonical set, so unexpected data renders
 * as "missing" rather than crashing or printing a bare number.
 */
export function genderLabel(code: unknown): string {
	return isGenderCode(code) ? GENDER_LABELS[code] : "—";
}

/**
 * Narrows a value read from a form field or query string to a gender code.
 * Returns undefined when the value is empty or not a valid code.
 */
export function toGenderCode(value: unknown): GENDER_TYPE | undefined {
	if (value === "" || value === null || value === undefined) return undefined;
	const code = Number(value);
	return isGenderCode(code) ? code : undefined;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Vietnamese mobile numbers: exactly 10 digits, starting with 0. */
export const PHONE_REGEX = /^0\d{9}$/;

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 0;
