-- ============================================
-- PAYMENT SERVICE DATABASE (payment_service_db)
-- ============================================
-- Generated from backend/service/payment-service/src/payments/entities/payment.entity.ts
-- to match the style of database/iam-service/*/schema.sql.
--
-- This service owns its own database. `appointment_id` is a cross-service UUID
-- link to core_clinic_service_db appointments.appointment_id (maintained by
-- application code, NO real foreign key). Refund fields track the approval
-- workflow: REQUESTED -> UNDER_REVIEW -> APPROVED -> REFUNDING -> REFUNDED | REJECTED.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MODULE: PAYMENTS
-- ============================================

CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL, -- References clinic-service appointments.appointment_id (cross-service, no FK)
    amount NUMERIC(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(8) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
    provider VARCHAR(30) NOT NULL DEFAULT 'vnpay',
    provider_txn_ref VARCHAR(100),
    order_info TEXT,
    -- Refund tracking
    refund_amount NUMERIC(12,2),
    refunded_at TIMESTAMP,
    -- Refund approval workflow (null = no refund activity)
    -- REQUESTED -> UNDER_REVIEW -> APPROVED -> REFUNDING -> REFUNDED | REJECTED
    refund_status VARCHAR(12),
    refund_reason TEXT,
    refund_requested_by UUID, -- References iam-service users.user_id (cross-service, no FK)
    refund_requested_at TIMESTAMP,
    refund_reviewed_by UUID, -- References iam-service users.user_id (cross-service, no FK)
    refund_reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes for performance optimization
-- ============================================
CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_status ON payments(status);
