export const CLINIC_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  MAINTENANCE: "maintenance",
} as const;

export type ClinicStatus = (typeof CLINIC_STATUS)[keyof typeof CLINIC_STATUS];

export const CLINIC_STATUS_OPTIONS = [
  { value: CLINIC_STATUS.ACTIVE, label: "Active", color: "green" },
  { value: CLINIC_STATUS.INACTIVE, label: "Inactive", color: "gray" },
  { value: CLINIC_STATUS.MAINTENANCE, label: "Maintenance", color: "orange" },
] as const;
