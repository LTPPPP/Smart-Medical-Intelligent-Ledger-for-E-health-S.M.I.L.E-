// Refund Lifecycle
export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REFUNDING = 'REFUNDING',
  REFUNDED = 'REFUNDED',
  REJECTED = 'REJECTED',
}

// Open Refund States
export const OPEN_REFUND_STATES: string[] = [
  RefundStatus.REQUESTED,
  RefundStatus.UNDER_REVIEW,
  RefundStatus.APPROVED,
  RefundStatus.REFUNDING,
];

// Reviewable Refund States
export const REVIEWABLE_REFUND_STATES: string[] = [
  RefundStatus.REQUESTED,
  RefundStatus.UNDER_REVIEW,
];
