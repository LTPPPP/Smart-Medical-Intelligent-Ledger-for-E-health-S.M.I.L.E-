/** Canonical ABO/Rh blood types — mirrors the chk_patients_blood_type DB constraint. */
export const BLOOD_TYPES = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export type BloodType = (typeof BLOOD_TYPES)[number];
