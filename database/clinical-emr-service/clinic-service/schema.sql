-- ============================================
-- CLINIC SERVICE DATABASE (core_clinic_service_db)
-- ============================================
-- NOTE: reformatted from a pg_dump snapshot for readability, to match the
-- style of database/iam-service/*/schema.sql. No tables, columns,
-- constraints or indexes were added or removed in this pass.

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE clinic_room_type AS ENUM (
    'examination',
    'surgery',
    'imaging'
);

-- ============================================
-- MODULE: CLINICS, ROOMS & SPECIALTIES
-- ============================================

CREATE TABLE clinics (
    clinic_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_name VARCHAR(255) NOT NULL,
    clinic_code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    ward VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    operating_hours JSONB,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    license_number VARCHAR(100),
    license_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE treatment_rooms (
    room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    room_name VARCHAR(100) NOT NULL,
    room_code VARCHAR(50) NOT NULL,
    room_type clinic_room_type NOT NULL,
    floor_number INTEGER,
    equipment_list JSONB,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clinic_id, room_code)
);

CREATE TABLE specialties (
    specialty_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialty_name VARCHAR(255) NOT NULL,
    specialty_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_specialties (
    doctor_id UUID NOT NULL, -- References iam-service users.user_id (cross-service, no FK)
    specialty_id UUID NOT NULL REFERENCES specialties(specialty_id) ON DELETE CASCADE,
    certification_number VARCHAR(100),
    certified_date DATE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (doctor_id, specialty_id)
);

CREATE TABLE work_shifts (
    shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: SERVICES & PRICING
-- ============================================

CREATE TABLE service_categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES service_categories(category_id),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_code VARCHAR(50) NOT NULL UNIQUE,
    service_name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES service_categories(category_id),
    specialty_id UUID REFERENCES specialties(specialty_id),
    description TEXT,
    duration_minutes INTEGER DEFAULT 30,
    base_price NUMERIC(10,2),
    currency VARCHAR(10) DEFAULT 'VND',
    is_active BOOLEAN DEFAULT true,
    requires_appointment BOOLEAN DEFAULT true,
    preparation_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    required_room_type clinic_room_type NOT NULL
);

CREATE TABLE clinic_services (
    clinic_service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(service_id) ON DELETE CASCADE,
    custom_price NUMERIC(10,2),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clinic_id, service_id)
);

-- ============================================
-- MODULE: DOCTOR SCHEDULING
-- ============================================

CREATE TABLE doctor_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL, -- References iam-service users.user_id (cross-service, no FK)
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    shift_id UUID REFERENCES work_shifts(shift_id),
    work_date DATE NOT NULL,
    room_id UUID REFERENCES treatment_rooms(room_id),
    max_patients INTEGER DEFAULT 20,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, work_date, shift_id)
);

CREATE TABLE doctor_leaves (
    leave_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL, -- References iam-service users.user_id (cross-service, no FK)
    leave_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schedule_changes (
    change_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES doctor_schedules(schedule_id) ON DELETE CASCADE,
    changed_by UUID NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    approved_by UUID,
    approval_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: APPOINTMENTS
-- ============================================

CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_code VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL, -- References iam-service users.user_id (cross-service, no FK)
    doctor_id UUID NOT NULL, -- References iam-service users.user_id (cross-service, no FK)
    clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    room_id UUID REFERENCES treatment_rooms(room_id),
    service_id UUID REFERENCES services(service_id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'scheduled',
    chief_complaint TEXT,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMP,
    is_outside_hours BOOLEAN DEFAULT false,
    outside_hours_reason TEXT,
    approved_by UUID,
    payment_id UUID,
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Generated booking window used by the overlap guards below
    occupied_during TSRANGE GENERATED ALWAYS AS (
        tsrange(
            (appointment_date + appointment_time),
            ((appointment_date + appointment_time) + '00:25:00'::interval)
                + (COALESCE(duration_minutes, 30)::double precision * '00:01:00'::interval),
            '[)'
        )
    ) STORED,
    session_id UUID,
    treatment_plan_id UUID,
    -- Prevent double-booking the same doctor/patient/room while the appointment is active
    CONSTRAINT appointments_doctor_occupied_excl EXCLUDE USING gist (
        doctor_id WITH =, occupied_during WITH &&
    ) WHERE (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress')),
    CONSTRAINT appointments_patient_occupied_excl EXCLUDE USING gist (
        patient_id WITH =, occupied_during WITH &&
    ) WHERE (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress')),
    CONSTRAINT appointments_room_occupied_excl EXCLUDE USING gist (
        room_id WITH =, occupied_during WITH &&
    ) WHERE (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress'))
);

CREATE TABLE appointment_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by UUID NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointment_reminder_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'APP',
    enabled BOOLEAN NOT NULL DEFAULT true,
    reminder_minutes_before INTEGER NOT NULL DEFAULT 1440,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_reminder_preferences_patient_channel UNIQUE (patient_id, channel)
);

CREATE TABLE appointment_notification_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'APP',
    status VARCHAR(20) NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    notification_id VARCHAR(100),
    preference_enabled BOOLEAN,
    reminder_minutes_before INTEGER,
    last_attempt_at TIMESTAMP,
    next_retry_at TIMESTAMP,
    error_message TEXT,
    read_at TIMESTAMP,
    responded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diagnostic_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    patient_id UUID NOT NULL, -- References iam-service users.user_id (cross-service, no FK)
    doctor_id UUID NOT NULL, -- References iam-service users.user_id (cross-service, no FK)
    order_code VARCHAR(50) NOT NULL UNIQUE,
    order_type VARCHAR(50) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'routine',
    tooth_number VARCHAR(10),
    area VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ordered',
    result_summary TEXT,
    result_attachment_url TEXT,
    notes TEXT,
    ordered_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: PLATFORM / INFRA
-- ============================================

-- TypeORM's internal migration ledger (auto-managed, do not edit by hand)
CREATE TABLE migrations (
    id SERIAL,
    "timestamp" BIGINT NOT NULL,
    name VARCHAR NOT NULL,
    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id)
);

CREATE TABLE idempotency_keys (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(512) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    response_status INTEGER,
    response_body JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    expires_at TIMESTAMP NOT NULL
);

-- ============================================
-- Indexes for performance optimization
-- ============================================
CREATE INDEX idx_clinics_code ON clinics(clinic_code);
CREATE INDEX idx_rooms_clinic ON treatment_rooms(clinic_id);
CREATE INDEX idx_doctor_specialties_doctor ON doctor_specialties(doctor_id);
CREATE INDEX idx_schedules_clinic_date ON doctor_schedules(clinic_id, work_date);
CREATE INDEX idx_schedules_doctor_date ON doctor_schedules(doctor_id, work_date);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status, appointment_date);
CREATE INDEX idx_appointments_session_id ON appointments(session_id);
CREATE INDEX idx_appointments_treatment_plan_id ON appointments(treatment_plan_id);
CREATE INDEX idx_appointment_history_id ON appointment_status_history(appointment_id);
CREATE INDEX idx_appointment_notification_logs_appointment ON appointment_notification_logs(appointment_id);
CREATE INDEX idx_diagnostic_orders_appointment ON diagnostic_orders(appointment_id);
CREATE INDEX idx_diagnostic_orders_code ON diagnostic_orders(order_code);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
