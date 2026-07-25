/**
 * Clinical severity scale shared by symptoms and diagnoses.
 *
 * CRITICAL is included because the examinations UI has always offered it and the
 * column stored it while validation was a bare @IsString; 'critical' is 8
 * characters, the same as 'moderate', so the varchar(8) width is unchanged.
 */
export enum Severity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

/** Canonical severities — mirrors the symptoms/diagnoses severity width. */
export const SEVERITY_VALUES: readonly string[] = Object.values(Severity);
