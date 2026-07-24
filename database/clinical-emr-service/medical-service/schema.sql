-- ============================================
-- MEDICAL SERVICE DATABASE (core_medical_service_db)
-- ============================================
-- NOTE: reformatted from a pg_dump snapshot for readability, to match the
-- style of database/iam-service/*/schema.sql. No tables, columns,
-- constraints or indexes were added or removed in this pass.
--
-- The duplicate session_id foreign keys that clinical_orders, prescriptions
-- and treatment_plans used to carry (one default-named + one "fk_..."-named,
-- both -> examination_sessions(session_id)) were cleaned up in migration
-- DropDuplicateSessionForeignKeys1784400100000: only the entity-generated
-- default-named FK remains on each table.
--
-- The NestJS boilerplate tables (file, role, status, "user", session) have
-- been removed from this schema; run cleanup-boilerplate.sql to drop them
-- from existing databases.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MODULE: PATIENTS
-- ============================================

CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- References iam-service users.user_id (cross-service, no FK)
    patient_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    ward VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    blood_type VARCHAR(10),
    allergies TEXT[],
    chronic_diseases TEXT[],
    insurance_number VARCHAR(100),
    insurance_provider VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patient_representatives (
    representative_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    legal_document_type VARCHAR(50),
    legal_document_number VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    authorized_for_treatment BOOLEAN NOT NULL DEFAULT false,
    authorized_for_payment BOOLEAN NOT NULL DEFAULT false,
    authorized_for_records BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP,
    verified_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    condition_name VARCHAR(255) NOT NULL,
    condition_type VARCHAR(50),
    diagnosed_date DATE,
    treatment TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: MEDICAL RECORDS
-- ============================================

CREATE TABLE medical_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    appointment_id UUID, -- References clinic-service appointments.appointment_id (cross-service, no FK)
    clinic_id UUID NOT NULL, -- References clinic-service clinics.clinic_id (cross-service, no FK)
    doctor_id UUID NOT NULL, -- References iam-service users.user_id (cross-service, no FK)
    visit_date DATE NOT NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    notes TEXT,
    record_status VARCHAR(20) DEFAULT 'draft',
    record_hash VARCHAR(255),
    finalized_at TIMESTAMP,
    finalized_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_record_versions (
    version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES medical_records(record_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    changed_by UUID NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE record_exports (
    export_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    record_id UUID REFERENCES medical_records(record_id) ON DELETE CASCADE,
    export_type VARCHAR(50),
    export_format VARCHAR(20),
    file_url TEXT,
    exported_by UUID NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: EXAMINATION SESSIONS
-- ============================================

CREATE TABLE examination_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID, -- References clinic-service appointments.appointment_id (cross-service, no FK)
    record_id UUID REFERENCES medical_records(record_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(patient_id),
    doctor_id UUID NOT NULL, -- References iam-service users.user_id (cross-service, no FK)
    clinic_id UUID NOT NULL, -- References clinic-service clinics.clinic_id (cross-service, no FK)
    session_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    chief_complaint TEXT,
    present_illness TEXT,
    physical_examination TEXT,
    vital_signs JSONB,
    status VARCHAR(20) DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    signed_at TIMESTAMP,
    signed_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE examination_session_amendments (
    amendment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    record_id UUID,
    patient_id UUID,
    doctor_id UUID NOT NULL,
    amendment_reason TEXT NOT NULL,
    amendment_text TEXT NOT NULL,
    amended_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT exam_amendments_session_fkey FOREIGN KEY (session_id)
        REFERENCES examination_sessions(session_id) ON DELETE CASCADE,
    CONSTRAINT exam_amendments_record_fkey FOREIGN KEY (record_id)
        REFERENCES medical_records(record_id) ON DELETE SET NULL,
    CONSTRAINT exam_amendments_patient_fkey FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id) ON DELETE SET NULL
);

CREATE TABLE symptoms (
    symptom_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES examination_sessions(session_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(patient_id),
    symptom_name VARCHAR(255) NOT NULL,
    body_location VARCHAR(100),
    severity VARCHAR(20),
    onset_date DATE,
    duration VARCHAR(100),
    description TEXT,
    recorded_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diagnoses (
    diagnosis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES examination_sessions(session_id) ON DELETE CASCADE,
    icd_code VARCHAR(20),
    diagnosis_name VARCHAR(255) NOT NULL,
    diagnosis_type VARCHAR(50),
    severity VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: DENTAL CHARTING & IMAGING
-- ============================================

CREATE TABLE dental_charts (
    chart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    record_id UUID REFERENCES medical_records(record_id) ON DELETE CASCADE,
    tooth_number INTEGER NOT NULL,
    tooth_status VARCHAR(50),
    surfaces JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(record_id, tooth_number)
);

CREATE TABLE image_categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dental_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    record_id UUID REFERENCES medical_records(record_id),
    category_id UUID REFERENCES image_categories(category_id),
    image_type VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size_kb INTEGER,
    file_format VARCHAR(10),
    tooth_numbers INTEGER[],
    view_angle VARCHAR(50),
    description TEXT,
    tags TEXT[],
    metadata JSONB,
    pacs_id VARCHAR(255),
    taken_date DATE,
    taken_by UUID,
    uploaded_by UUID NOT NULL,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE image_annotations (
    annotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID REFERENCES dental_images(image_id) ON DELETE CASCADE,
    annotated_by UUID NOT NULL,
    annotation_type VARCHAR(50),
    annotation_data JSONB,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pacs_sync_logs (
    sync_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID REFERENCES dental_images(image_id),
    sync_type VARCHAR(50),
    pacs_server VARCHAR(255),
    status VARCHAR(20),
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: CLINICAL ORDERS & LAB RESULTS
-- ============================================

CREATE TABLE clinical_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES examination_sessions(session_id) ON DELETE CASCADE,
    record_id UUID REFERENCES medical_records(record_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    ordered_by UUID NOT NULL,
    order_type VARCHAR(50) NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    clinical_indication TEXT,
    teeth_numbers INTEGER[],
    urgency VARCHAR(20) DEFAULT 'routine',
    status VARCHAR(20) DEFAULT 'ordered',
    ordered_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    scheduled_date TIMESTAMP,
    completed_date TIMESTAMP,
    result_url TEXT,
    report TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_test_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES clinical_orders(order_id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    result_value TEXT,
    result_unit VARCHAR(50),
    reference_range VARCHAR(100),
    is_abnormal BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: TREATMENT PLANS & HISTORY
-- ============================================

CREATE TABLE treatment_plans (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES examination_sessions(session_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    record_id UUID REFERENCES medical_records(record_id),
    plan_name VARCHAR(255),
    objectives TEXT,
    duration_weeks INTEGER,
    status VARCHAR(20) DEFAULT 'draft',
    estimated_cost NUMERIC(12,2),
    quote_currency VARCHAR(3),
    sent_at TIMESTAMP,
    sent_to UUID,
    sent_via VARCHAR(20),
    confirmed_at TIMESTAMP,
    proposed_at TIMESTAMP,
    accepted_at TIMESTAMP,
    accepted_by UUID,
    declined_at TIMESTAMP,
    declined_by UUID,
    decline_reason TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quote_version VARCHAR(100),
    risk_disclosure TEXT,
    alternative_options TEXT,
    acceptance_scope VARCHAR(20),
    accepted_scope_note TEXT,
    accepted_representative_id UUID,
    accepted_representative_name VARCHAR(255),
    accepted_representative_relationship VARCHAR(100),
    accepted_representative_phone VARCHAR(20),
    CONSTRAINT fk_treatment_plans_accepted_representative
        FOREIGN KEY (accepted_representative_id)
        REFERENCES patient_representatives(representative_id) ON DELETE SET NULL
);

CREATE TABLE treatment_history (
    treatment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES medical_records(record_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    treatment_date DATE NOT NULL,
    tooth_numbers INTEGER[],
    procedure_code VARCHAR(50),
    procedure_name VARCHAR(255) NOT NULL,
    description TEXT,
    cost NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'completed',
    performed_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MODULE: PRESCRIPTIONS
-- ============================================

CREATE TABLE prescriptions (
    prescription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES examination_sessions(session_id) ON DELETE CASCADE,
    record_id UUID REFERENCES medical_records(record_id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(patient_id),
    doctor_id UUID NOT NULL,
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'draft',
    notes TEXT,
    digital_signature_id UUID,
    issued_at TIMESTAMP,
    issued_by UUID,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    minor_patient_at_issue BOOLEAN,
    patient_age_years_at_issue INTEGER,
    patient_age_months_at_issue INTEGER,
    representative_name_snapshot VARCHAR(255),
    representative_phone_snapshot VARCHAR(20),
    representative_id_snapshot UUID,
    representative_relationship_snapshot VARCHAR(100)
);

CREATE TABLE prescription_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    medication_code VARCHAR(50),
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(50),
    frequency VARCHAR(100) NOT NULL,
    duration_days INTEGER,
    quantity INTEGER,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- ============================================
-- Indexes for performance optimization
-- ============================================
CREATE INDEX idx_patients_code ON patients(patient_code);
CREATE INDEX idx_patient_representatives_patient ON patient_representatives(patient_id);
CREATE INDEX idx_patient_representatives_authorized ON patient_representatives(patient_id, is_active, is_primary);
CREATE INDEX idx_records_patient ON medical_records(patient_id, visit_date);
CREATE INDEX idx_record_versions_record ON medical_record_versions(record_id);
CREATE INDEX idx_record_exports_patient ON record_exports(patient_id);
CREATE INDEX idx_exam_sessions_appointment ON examination_sessions(appointment_id);
CREATE INDEX idx_exam_sessions_record ON examination_sessions(record_id);
CREATE INDEX idx_exam_amendments_session ON examination_session_amendments(session_id);
CREATE INDEX idx_exam_amendments_record ON examination_session_amendments(record_id);
CREATE INDEX idx_symptoms_session ON symptoms(session_id);
CREATE INDEX idx_dental_charts_record ON dental_charts(record_id);
CREATE INDEX idx_images_patient ON dental_images(patient_id, taken_date);
CREATE INDEX idx_images_type ON dental_images(image_type);
CREATE INDEX idx_clinical_orders_patient ON clinical_orders(patient_id, status);
CREATE INDEX idx_clinical_orders_session ON clinical_orders(session_id);
CREATE INDEX idx_treatment_plans_session ON treatment_plans(session_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id, prescription_date);
CREATE INDEX idx_prescriptions_session ON prescriptions(session_id);
