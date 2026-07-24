/**
 * Refund lifecycle (K4): a refund is requested by a patient/reception, then
 * reviewed by an admin who either approves (which drives the money movement
 * through REFUNDING to REFUNDED) or rejects it.
 */
export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REFUNDING = 'REFUNDING',
  REFUNDED = 'REFUNDED',
  REJECTED = 'REJECTED',
}

// States in which a refund request is still open (blocks a duplicate request).
export const OPEN_REFUND_STATES: string[] = [
  RefundStatus.REQUESTED,
  RefundStatus.UNDER_REVIEW,
  RefundStatus.APPROVED,
  RefundStatus.REFUNDING,
];

// States from which an admin may still approve/reject.
export const REVIEWABLE_REFUND_STATES: string[] = [
  RefundStatus.REQUESTED,
  RefundStatus.UNDER_REVIEW,
];
