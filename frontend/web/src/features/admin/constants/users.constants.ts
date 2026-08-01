import { GENDER, GENDER_LABELS } from "@/shared/constants/common";

// Gender Filter Options
export const GENDER_OPTIONS = [
	{ value: "", label: "All Genders" },
	{ value: String(GENDER.MALE), label: GENDER_LABELS[GENDER.MALE] },
	{ value: String(GENDER.FEMALE), label: GENDER_LABELS[GENDER.FEMALE] },
	{ value: String(GENDER.UNKNOWN), label: GENDER_LABELS[GENDER.UNKNOWN] },
] as const;
