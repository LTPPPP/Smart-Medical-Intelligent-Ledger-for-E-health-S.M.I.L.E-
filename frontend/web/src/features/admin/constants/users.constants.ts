import { GENDER, GENDER_LABELS } from '@/shared/constants/common';

/**
 * Filter options for the users table. The empty-string value means "no filter" —
 * it stays a string so it is distinguishable from code 0 (Unknown), which is a
 * real gender value the API can return.
 */
export const GENDER_OPTIONS = [
  { value: '', label: 'All Genders' },
  { value: String(GENDER.MALE), label: GENDER_LABELS[GENDER.MALE] },
  { value: String(GENDER.FEMALE), label: GENDER_LABELS[GENDER.FEMALE] },
  { value: String(GENDER.UNKNOWN), label: GENDER_LABELS[GENDER.UNKNOWN] },
] as const;
