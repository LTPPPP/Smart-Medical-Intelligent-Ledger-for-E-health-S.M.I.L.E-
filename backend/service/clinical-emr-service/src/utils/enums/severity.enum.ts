// Severity Scale
export enum Severity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

// Canonical Values
export const SEVERITY_VALUES: readonly string[] = Object.values(Severity);
