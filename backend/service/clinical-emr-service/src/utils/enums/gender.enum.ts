export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

/** Canonical gender values — mirrors the chk_patients_gender DB constraint. */
export const GENDER_VALUES: readonly string[] = Object.values(Gender);
