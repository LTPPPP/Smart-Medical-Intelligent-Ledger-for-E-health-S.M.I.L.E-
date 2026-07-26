import { GENDER, GENDER_LABELS, isGenderCode } from "@/shared/constants/common";

const GENDER_CONFIG: Record<number, { label: string; cls: string }> = {
	[GENDER.MALE]: {
		label: GENDER_LABELS[GENDER.MALE],
		cls: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40",
	},
	[GENDER.FEMALE]: {
		label: GENDER_LABELS[GENDER.FEMALE],
		cls: "bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800/40",
	},
	[GENDER.UNKNOWN]: {
		label: GENDER_LABELS[GENDER.UNKNOWN],
		cls: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40",
	},
};

export function GenderBadge({ gender }: { gender: number | null }) {
	// Checked with isGenderCode, not truthiness: 0 (Unknown) is a real value.
	if (!isGenderCode(gender)) {
		return (
			<span className="font-inter text-xs text-smile-description/50">—</span>
		);
	}
	const c = GENDER_CONFIG[gender];
	return (
		<span
			className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-inter text-[10px] font-semibold capitalize ${c.cls}`}
		>
			{c.label}
		</span>
	);
}
