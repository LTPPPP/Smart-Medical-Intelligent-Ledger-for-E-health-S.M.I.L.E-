export enum Currency {
  VND = 'VND',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
}

/** Canonical currency codes — mirrors the chk_*_currency DB constraints. */
export const CURRENCY_VALUES: readonly string[] = Object.values(Currency);
