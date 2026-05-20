export type GENDER_TYPE = 'MALE' | 'FEMALE' | 'OTHER';

export const GENDER_OPTIONS = [
  { value: 'MALE' as const, label: 'Male' },
  { value: 'FEMALE' as const, label: 'Female' },
  { value: 'OTHER' as const, label: 'Other' },
] as const;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 0;