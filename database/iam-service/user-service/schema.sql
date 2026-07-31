-- ============================================
-- 1. USER PROFILE & AUTHORIZATION SERVICE DATABASE
-- ============================================
-- Users table (Profile focused with denormalized fields for quick query)
CREATE TABLE users (
    user_id UUID PRIMARY KEY, -- Links to auth_service_db.accounts.account_id
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255), -- Denormalized from Auth
    phone VARCHAR(20), -- Denormalized from Auth
    date_of_birth DATE,
    gender SMALLINT, -- ISO 5218 code: 0 unknown, 1 male, 2 female (chk_users_gender)
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    banned_at TIMESTAMPTZ,
    ban_reason TEXT
);

-- Roles table
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(12) UNIQUE NOT NULL, -- ADMIN, DOCTOR, RECEPTIONIST, PATIENT, NURSE, MANAGER (matches backend RoleEnum)
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Permissions table
CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL, -- appointment, medical_record, etc. NOTE: entity drift — PermissionEntity declares resource/action nullable; migration CreateUserServiceTables1700000000000 says NOT NULL
    action VARCHAR(20) NOT NULL, -- create, read, update, delete
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Role permissions mapping
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(permission_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID,
    UNIQUE(role_id, permission_id)
);

-- User roles mapping (with full audit trail UC-014)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID,
    UNIQUE(user_id, role_id)
);

-- Phone Verification (Simplified KYC UC-020)
CREATE TABLE phone_verifications (
    verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    verified_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full KYC verification (Identity Card/Passport verification)
-- Columns beyond the base block come from migrations EnhanceKycVerifications1700000001000,
-- HardenKycPrivacy1700000002000, AddKycDecisionMetadata1700000003000; widths from TightenColumnWidths1700000008000.
CREATE TABLE kyc_verifications (
    kyc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    id_type VARCHAR(50) NOT NULL, -- passport, national_id, driver_license
    id_number VARCHAR(100) NOT NULL,
    full_name VARCHAR(255), -- as printed on the ID document
    date_of_birth DATE,
    id_front_image TEXT,
    id_back_image TEXT,
    selfie_image TEXT,
    verification_status VARCHAR(14) DEFAULT 'pending', -- NOT_SUBMITTED, PENDING_REVIEW, VERIFIED, REJECTED. NOTE: entity drift — DB default is still 'pending' (create migration; Enhance only rewrote rows), entity default is 'PENDING_REVIEW'
    -- OCR pipeline (EnhanceKycVerifications)
    ocr_status VARCHAR(10) DEFAULT 'PENDING', -- PENDING, PROCESSING, SKIPPED, COMPLETED, FAILED
    ocr_confidence INTEGER,
    ocr_payload JSONB,
    ocr_attempts INTEGER DEFAULT 0,
    ocr_last_error TEXT,
    ocr_processed_at TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL, -- reviewer who verified
    -- Review decision (AddKycDecisionMetadata)
    decision_source VARCHAR(6), -- AUTO, MANUAL
    decision_reason TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMP,
    document_hash CHAR(64), -- sha256 hex of the ID scan
    notes TEXT,
    admin_notes TEXT,
    -- Consent & retention (HardenKycPrivacy)
    consent_version VARCHAR(50),
    consent_accepted_at TIMESTAMP,
    document_storage_consent_accepted_at TIMESTAMP,
    ocr_processing_consent_accepted_at TIMESTAMP,
    no_marketing_consent_accepted_at TIMESTAMP,
    processing_purpose VARCHAR(100) NOT NULL DEFAULT 'identity_verification_and_booking_safety',
    retention_policy_version VARCHAR(50),
    retention_expires_at TIMESTAMP,
    deleted_at TIMESTAMP, -- soft delete for privacy erasure
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Audit Logs (Access & Action Logs UC-015)
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_kyc_status ON kyc_verifications(verification_status);
CREATE INDEX idx_kyc_user ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_created_at ON kyc_verifications(created_at);
CREATE INDEX idx_kyc_verifications_verified_by ON kyc_verifications(verified_by);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_phone_verifications_user ON phone_verifications(user_id);

-- ============================================
-- MODULE: NOTIFICATION TEMPLATES
-- (Merged from notification-service)
-- ============================================

-- Notification Templates (Content blueprints)
CREATE TABLE notification_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_code VARCHAR(100) UNIQUE NOT NULL, -- APPOINTMENT_REMINDER, OTP_VERIFY
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject_template TEXT, -- Handlebars-style template for email subject
    body_template TEXT NOT NULL, -- Handlebars-style template for message body
    channel VARCHAR(5) NOT NULL, -- SMS, EMAIL, PUSH, APP (chk_notification_templates_channel)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: NOTIFICATION PREFERENCES
-- ============================================

-- Notification Preferences (User settings)
CREATE TABLE notification_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- same-DB FK -> users
    notification_type VARCHAR(100) NOT NULL, -- PROMO, APPOINTMENT, SYSTEM. NOTE: entity drift — NotificationPreferenceEntity declares length 50; migration says 100
    channel VARCHAR(5) NOT NULL, -- SMS, EMAIL, PUSH, APP (chk_notification_preferences_channel)
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type, channel)
);

-- ============================================
-- MODULE: NOTIFICATIONS
-- ============================================

-- Unified Notification table (Centralized record)
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- same-DB FK -> users
    template_id UUID REFERENCES notification_templates(template_id) ON DELETE SET NULL,
    notification_type VARCHAR(100), -- appointment_reminder, otp, payment_confirmation. NOTE: entity drift — NotificationEntity declares length 50; migration says 100
    channel VARCHAR(5) NOT NULL, -- SMS, EMAIL, PUSH, APP (chk_notifications_channel)
    subject TEXT, -- NOTE: entity drift — NotificationEntity declares VARCHAR(255); migration says TEXT
    message TEXT NOT NULL,
    related_entity_id UUID, -- schedule_id, appointment_id, payment_id
    related_entity_type VARCHAR(100), -- appointment, payment, worker_schedule. NOTE: entity drift — NotificationEntity declares length 50; migration says 100
    scheduled_at TIMESTAMP, -- NOTE: entity drift — NotificationEntity declares NOT NULL; migration says nullable, no default
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR(9) NOT NULL DEFAULT 'PENDING', -- pending, sent, failed, read, cancelled. NOTE: entity drift — entity default is lowercase 'pending'; migration default is 'PENDING'
    -- Reliability logic
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery logs (Technical trace)
CREATE TABLE notification_delivery_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(notification_id) ON DELETE CASCADE,
    gateway_name VARCHAR(50), -- Twilio, SendGrid, Firebase. NOTE: entity drift — NotificationDeliveryLogEntity declares length 100; migration says 50
    gateway_response_id VARCHAR(255),
    status VARCHAR(20), -- success, failed
    error_payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Indexes (as created by CreateNotificationTables1700000001000)
-- NOTE: earlier revisions of this file listed composite indexes (recipient_id, scheduled_at),
-- (status, scheduled_at) and (related_entity_id, related_entity_type) — no migration creates them.
CREATE INDEX "IDX_notifications_recipient" ON notifications(recipient_id);
CREATE INDEX "IDX_notifications_status" ON notifications(status);
CREATE INDEX "IDX_notification_preferences_user" ON notification_preferences(user_id);
CREATE INDEX "IDX_notification_templates_code" ON notification_templates(template_code);
CREATE INDEX "IDX_delivery_logs_notification_id" ON notification_delivery_logs(notification_id);