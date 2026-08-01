// Gender Codes
export enum Gender {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2,
}

// Canonical Values
export const GENDER_VALUES: readonly number[] = [
  Gender.UNKNOWN,
  Gender.MALE,
  Gender.FEMALE,
];

// Display Labels
export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.UNKNOWN]: 'Unknown',
  [Gender.MALE]: 'Male',
  [Gender.FEMALE]: 'Female',
};
