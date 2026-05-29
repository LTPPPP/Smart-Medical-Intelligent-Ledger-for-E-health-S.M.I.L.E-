-- Tạo database thứ 2 cho clinic service
-- Database đầu tiên (core_medical_service_db) đã được tạo qua POSTGRES_DB env
SELECT 'CREATE DATABASE core_clinic_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'core_clinic_service_db'
)\gexec

-- ====================================================================
-- Schema DDL cho các bảng mới (managed by TypeORM but documented here)
-- Tuân thủ Thông tư 21/2017/TT-BYT và Nghị định 13/2023/NĐ-CP
-- ====================================================================

-- Enum types cho examination_sessions
DO $$ BEGIN
  CREATE TYPE examination_session_status_enum AS ENUM (
    'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum types cho diagnoses
DO $$ BEGIN
  CREATE TYPE diagnosis_type_enum AS ENUM (
    'preliminary',   -- Chẩn đoán sơ bộ
    'differential',  -- Chẩn đoán phân biệt
    'confirmed',     -- Chẩn đoán xác định
    'complication'   -- Biến chứng
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE diagnosis_severity_enum AS ENUM (
    'mild', 'moderate', 'severe', 'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum types cho medical_certificates
DO $$ BEGIN
  CREATE TYPE medical_certificate_type_enum AS ENUM (
    'sick_leave',   -- Giấy nghỉ ốm
    'fitness',      -- Giấy chứng nhận sức khỏe
    'disability',   -- Giấy chứng nhận khuyết tật
    'maternity',    -- Giấy chứng nhận thai sản
    'admission'     -- Giấy nhập viện
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE medical_certificate_status_enum AS ENUM (
    'issued', 'voided', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum types cho referrals
DO $$ BEGIN
  CREATE TYPE referral_urgency_enum AS ENUM (
    'routine',    -- Thường
    'urgent',     -- Khẩn
    'emergency'   -- Cấp cứu
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE referral_status_enum AS ENUM (
    'pending', 'accepted', 'rejected', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table: medical_certificates
-- Giấy chứng nhận y tế (giấy nghỉ ốm, sức khỏe, ...)
CREATE TABLE IF NOT EXISTS medical_certificates (
  cert_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES examination_sessions(session_id) ON DELETE CASCADE,
  record_id             UUID,
  patient_id            UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  cert_type             medical_certificate_type_enum NOT NULL DEFAULT 'sick_leave',
  issued_date           DATE NOT NULL,
  valid_from            DATE,
  valid_to              DATE,
  days_granted          SMALLINT,
  reason                TEXT,
  restrictions          TEXT,
  doctor_id             UUID NOT NULL,
  doctor_name_snapshot  VARCHAR(255),
  doctor_license_number VARCHAR(100),
  doctor_signature_id   UUID,
  status                medical_certificate_status_enum NOT NULL DEFAULT 'issued',
  void_reason           TEXT,
  voided_by             UUID,
  voided_at             TIMESTAMP,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: referrals
-- Giấy chuyển viện
CREATE TABLE IF NOT EXISTS referrals (
  referral_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id                UUID NOT NULL REFERENCES examination_sessions(session_id) ON DELETE CASCADE,
  patient_id                UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  from_clinic_id            UUID NOT NULL,
  from_clinic_name_snapshot VARCHAR(255),
  to_facility_name          VARCHAR(255) NOT NULL,
  to_facility_address       VARCHAR(255),
  to_department             VARCHAR(255),
  to_doctor_name            VARCHAR(255),
  referral_reason           TEXT NOT NULL,
  clinical_summary          TEXT,
  accompanying_documents    JSONB,
  urgency                   referral_urgency_enum NOT NULL DEFAULT 'routine',
  status                    referral_status_enum NOT NULL DEFAULT 'pending',
  issued_by                 UUID NOT NULL,
  issued_by_name_snapshot   VARCHAR(255),
  issued_at                 TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_until               TIMESTAMP,
  accepted_by               UUID,
  accepted_at               TIMESTAMP,
  created_at                TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_medical_certificates_session_id ON medical_certificates(session_id);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_patient_id ON medical_certificates(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_session_id ON referrals(session_id);
CREATE INDEX IF NOT EXISTS idx_referrals_patient_id ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_examination_sessions_patient_id ON examination_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_examination_sessions_doctor_id ON examination_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_session_icd ON diagnoses(session_id, icd_code);
