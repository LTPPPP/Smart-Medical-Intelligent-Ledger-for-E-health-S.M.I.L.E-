-- ============================================
-- AI & ANALYTICS SERVICE DATABASE (ai_service_db)
-- ============================================
-- Generated from docs/services/ai-service.md (§2 Structure and Database
-- Design), to match the style of database/iam-service/*/schema.sql.
--
-- NOTE: ai/app (FastAPI) has no ORM entities yet — its only persistence
-- today is Qdrant (document chunks/embeddings, see
-- ai/app/src/shared/vectorstore.py). The chatbot is currently stateless
-- (BookingSlotState round-trips through the client, nothing is persisted).
-- This schema implements the relational design the service doc calls for;
-- document/chunk storage stays in Qdrant and is not modeled here.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MODULE: CHATBOT
-- ============================================

CREATE TABLE chatbot_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL, -- References iam-service accounts.account_id (cross-service, no FK)
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    channel VARCHAR(20) NOT NULL DEFAULT 'web_chat',
    intent_type VARCHAR(15), -- by_clinic, by_specialty, by_doctor, outside_hours
    status VARCHAR(10) NOT NULL DEFAULT 'active', -- active, completed, abandoned
    outcome VARCHAR(30), -- appointment_booked, appointment_cancelled, escalated, none
    appointment_id UUID, -- References clinical-emr-service appointments.appointment_id (cross-service, no FK)
    last_state JSONB, -- Last BookingSlotState snapshot from the client
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chatbot_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE,
    role VARCHAR(9) NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    flow VARCHAR(15), -- booking, cancel, conversational
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: NLP INTENT & SUGGESTION TRACKING
-- ============================================

CREATE TABLE ai_intent_logs (
    intent_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE,
    message_id UUID REFERENCES chatbot_messages(message_id) ON DELETE SET NULL,
    detected_intent VARCHAR(15),
    confidence NUMERIC(5,4),
    entities JSONB, -- e.g. {"chief_complaint": "toothache", "appointment_date": "tomorrow"}
    model_name VARCHAR(100), -- e.g. config.llm_model
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_suggestions (
    suggestion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE,
    suggestion_type VARCHAR(30) NOT NULL, -- doctor_slot, clinic, specialty, booking_option
    payload JSONB NOT NULL,
    accepted BOOLEAN,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: ANALYTICS
-- ============================================

-- Nightly ETL snapshot (reads core_clinic_service_db + payment_service_db).
-- Dimension columns nullable: NULL = aggregated across that dimension.
CREATE TABLE analytics_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    clinic_id UUID, -- References clinical-emr-service clinics.clinic_id (cross-service, no FK)
    specialty_id UUID, -- References clinical-emr-service specialties.specialty_id (cross-service, no FK)
    doctor_id UUID, -- References clinical-emr-service doctors.doctor_id (cross-service, no FK)
    revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    appointment_count INTEGER NOT NULL DEFAULT 0,
    utilization_rate NUMERIC(5,2),
    satisfaction_score NUMERIC(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (snapshot_date, clinic_id, specialty_id, doctor_id)
);

-- ============================================
-- MODULE: REPORTING
-- ============================================

CREATE TABLE report_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(10) NOT NULL DEFAULT 'pdf', -- pdf, excel
    schedule_cron VARCHAR(100),
    recipients JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE generated_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES report_templates(template_id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL DEFAULT 'pdf', -- pdf, xlsx
    status VARCHAR(10) NOT NULL DEFAULT 'pending', -- pending, generated, sent, failed
    file_url TEXT,
    generated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes for performance optimization
-- ============================================
CREATE INDEX idx_chatbot_sessions_account ON chatbot_sessions(account_id);
CREATE INDEX idx_chatbot_sessions_status ON chatbot_sessions(status);
CREATE INDEX idx_chatbot_sessions_appointment ON chatbot_sessions(appointment_id);
CREATE INDEX idx_chatbot_messages_session ON chatbot_messages(session_id);
CREATE INDEX idx_ai_intent_logs_session ON ai_intent_logs(session_id);
CREATE INDEX idx_ai_suggestions_session ON ai_suggestions(session_id);
CREATE INDEX idx_analytics_snapshots_date ON analytics_snapshots(snapshot_date);
CREATE INDEX idx_analytics_snapshots_clinic ON analytics_snapshots(clinic_id);
CREATE INDEX idx_generated_reports_template ON generated_reports(template_id);
CREATE INDEX idx_generated_reports_status ON generated_reports(status);
