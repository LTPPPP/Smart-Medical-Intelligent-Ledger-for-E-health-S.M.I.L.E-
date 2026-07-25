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
    is_banned BOOLEAN DEFAULT FALSE,
    banned_at TIMESTAMPTZ,
    ban_reason TEXT
);

-- Roles table
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) UNIQUE NOT NULL, -- ADMIN, DOCTOR, RECEPTIONIST, PATIENT, NURSE, MANAGER (matches backend RoleEnum)
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
    resource VARCHAR(50) NOT NULL, -- appointment, medical_record, etc.
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

-- Digital signatures
CREATE TABLE digital_signatures (
    signature_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    signature_data TEXT NOT NULL, -- Base64 encoded signature image
    certificate_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, REVOKED
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
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
CREATE TABLE kyc_verifications (
    kyc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    id_type VARCHAR(50) NOT NULL, -- passport, national_id, driver_license
    id_number VARCHAR(100) NOT NULL,
    id_front_image TEXT,
    id_back_image TEXT,
    selfie_image TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL, -- reviewer who verified
    blockchain_hash VARCHAR(255),
    notes TEXT,
    admin_notes TEXT,
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
CREATE INDEX idx_digital_signatures_user ON digital_signatures(user_id);
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
    channel VARCHAR(20) NOT NULL, -- SMS, EMAIL, PUSH, APP
    is_active BOOLEAN DEFAULT TRUE,
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
    notification_type VARCHAR(50) NOT NULL, -- PROMO, APPOINTMENT, SYSTEM
    channel VARCHAR(20) NOT NULL, -- SMS, EMAIL, PUSH, APP
    is_enabled BOOLEAN DEFAULT TRUE,
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
    template_id UUID REFERENCES notification_templates(template_id),
    notification_type VARCHAR(50), -- appointment_reminder, otp, payment_confirmation
    channel VARCHAR(20) NOT NULL, -- SMS, EMAIL, PUSH, APP
    subject VARCHAR(255),
    message TEXT NOT NULL,
    related_entity_id UUID, -- schedule_id, appointment_id, payment_id
    related_entity_type VARCHAR(50), -- appointment, payment, worker_schedule
    scheduled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, read, cancelled
    -- Reliability logic
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery logs (Technical trace)
CREATE TABLE notification_delivery_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(notification_id) ON DELETE CASCADE,
    gateway_name VARCHAR(100), -- Twilio, SendGrid, Firebase
    gateway_response_id VARCHAR(255),
    status VARCHAR(20), -- success, failed
    error_payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Indexes
CREATE INDEX idx_notif_recipient ON notifications(recipient_id, scheduled_at);
CREATE INDEX idx_notif_status ON notifications(status, scheduled_at);
CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);
CREATE INDEX idx_notif_templates_code ON notification_templates(template_code);
CREATE INDEX idx_notif_entity ON notifications(related_entity_id, related_entity_type);