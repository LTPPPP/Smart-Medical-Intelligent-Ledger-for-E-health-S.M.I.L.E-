-- ============================================
-- 1. AUTHENTICATION SERVICE DATABASE
-- ============================================

-- Accounts table (Authentication & Credentials)
CREATE TABLE accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    gender SMALLINT, -- ISO 5218 code: 0 unknown, 1 male, 2 female (chk_accounts_gender)
    role VARCHAR(20) DEFAULT 'PATIENT', -- ADMIN, DOCTOR, RECEPTIONIST, PATIENT, NURSE, MANAGER (chk_accounts_role)
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, LOCKED, SUSPENDED, DEACTIVATED
    failed_login_attempts INTEGER DEFAULT 0,
    locked_at TIMESTAMP,
    locked_reason TEXT,
    locked_by UUID REFERENCES accounts(account_id) ON DELETE SET NULL, -- admin who locked
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- OAuth connections (Google, Facebook, Apple)
CREATE TABLE oauth_connections (
    connection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(account_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- google, facebook, apple
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(provider, provider_user_id)
);

-- Refresh tokens for session management (UC-002 logout invalidation)
CREATE TABLE refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(account_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    device_info TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP tokens (Login, Password Reset, Phone/Email Verification)
CREATE TABLE otp_tokens (
    otp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(account_id) ON DELETE CASCADE,
    otp_code VARCHAR(10) NOT NULL,
    otp_type VARCHAR(20) NOT NULL, -- login, password_reset, identity_verify
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Indexes for performance optimization
CREATE INDEX idx_accounts_username ON accounts(username);
CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_phone ON accounts(phone);
CREATE INDEX idx_oauth_connections_account ON oauth_connections(account_id);
CREATE INDEX idx_otp_tokens_account ON otp_tokens(account_id);
CREATE INDEX idx_otp_tokens_expires ON otp_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_account ON refresh_tokens(account_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);