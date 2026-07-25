/**
 * Lifecycle of a payment attempt, independent of the refund workflow tracked by
 * RefundStatus. 'refunded' is the terminal state once a refund settles.
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/** Canonical payment statuses — mirrors the payments.status width. */
export const PAYMENT_STATUS_VALUES: readonly string[] =
  Object.values(PaymentStatus);

/**
 * Currency codes accepted by chk_payments_currency. ISO 4217 codes are exactly
 * three characters, which is why payments.currency is char(3).
 */
export enum Currency {
  VND = 'VND',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
}

/** Canonical currency codes — mirrors chk_payments_currency. */
export const CURRENCY_VALUES: readonly string[] = Object.values(Currency);
