/** Gender Codes */
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

/** Valid Gender Code */
export function isGenderCode(code: unknown): code is GENDER_TYPE {
	return (
		code === GENDER.UNKNOWN || code === GENDER.MALE || code === GENDER.FEMALE
	);
}

/** Gender Label */
export function genderLabel(code: unknown): string {
	return isGenderCode(code) ? GENDER_LABELS[code] : "—";
}

/** Parse Gender Code */
export function toGenderCode(value: unknown): GENDER_TYPE | undefined {
	if (value === "" || value === null || value === undefined) return undefined;
	const code = Number(value);
	return isGenderCode(code) ? code : undefined;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Phone Regex */
export const PHONE_REGEX = /^0\d{9}$/;

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 0;
