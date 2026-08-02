// Payment Lifecycle
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Payment Status Values
export const PAYMENT_STATUS_VALUES: readonly string[] =
  Object.values(PaymentStatus);

// Currency Codes
export enum Currency {
  VND = 'VND',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
}

// Currency Values
export const CURRENCY_VALUES: readonly string[] = Object.values(Currency);
