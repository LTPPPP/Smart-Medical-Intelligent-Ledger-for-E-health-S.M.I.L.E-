/**
 * Gender codes following ISO/IEC 5218.
 *
 * Stored as `smallint` in `patients.gender` and mirrored by the
 * chk_patients_gender DB constraint. ISO 5218 also defines 9 (not applicable);
 * this system does not use it, so 0 covers both "not stated" and "other".
 */
export enum Gender {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2,
}

/** Canonical gender codes — mirrors the chk_patients_gender DB constraint. */
export const GENDER_VALUES: readonly number[] = [
  Gender.UNKNOWN,
  Gender.MALE,
  Gender.FEMALE,
];

/** Display labels, keyed by code. */
export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.UNKNOWN]: 'Unknown',
  [Gender.MALE]: 'Male',
  [Gender.FEMALE]: 'Female',
};
