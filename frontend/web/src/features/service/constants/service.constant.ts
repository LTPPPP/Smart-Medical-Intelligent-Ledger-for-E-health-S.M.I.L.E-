// Service Status Constants
export const SERVICE_STATUS = {
  ACTIVE: 'ACTIVE' as const,
  INACTIVE: 'INACTIVE' as const,
};

// Status Badge Colors
export const SERVICE_STATUS_COLORS = {
  [SERVICE_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [SERVICE_STATUS.INACTIVE]: 'bg-smile-footer-bg text-smile-title',
} as const;

// Service Status Options for dropdowns
export const SERVICE_STATUS_OPTIONS = [
  { value: SERVICE_STATUS.ACTIVE, label: 'Active', color: 'green' },
  { value: SERVICE_STATUS.INACTIVE, label: 'Inactive', color: 'neutral' },
] as const;

// Currency Options
export const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VND (₫)', symbol: '₫' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
] as const;

// Duration Options (in minutes)
export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
] as const;

// Specialty Icons
export const SPECIALTY_ICONS = {
  GEN_DENT: 'mdi:tooth',
  ORTHO: 'mdi:dental-braces',
  ORAL_SURG: 'mdi:scalpel',
  COSMETIC: 'mdi:white-balance-sunny',
  PERIO: 'mdi:bacteria',
  ENDO: 'mdi:tooth-outline',
} as const;

// Default values
export const DEFAULT_SERVICE_VALUES = {
  durationMinutes: 30,
  currency: 'VND',
  requiresAppointment: true,
  isActive: true,
} as const;

export const DEFAULT_SPECIALTY_VALUES = {
  isActive: true,
  displayOrder: 999,
} as const;
