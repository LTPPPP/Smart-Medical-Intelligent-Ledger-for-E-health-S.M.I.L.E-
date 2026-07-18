-- ============================================================
-- S.M.I.L.E — Smart Medical Intelligent Ledger for E-health
-- PostgreSQL schema + seed data
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS & AUTH
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(50) NOT NULL UNIQUE,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    role_id       INTEGER NOT NULL REFERENCES roles(id),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. PATIENTS & MEDICAL RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_code  VARCHAR(20) NOT NULL UNIQUE,
    full_name     VARCHAR(120) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender        VARCHAR(10) CHECK (gender IN ('male','female','other')),
    blood_type    VARCHAR(5),
    phone         VARCHAR(20),
    address       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_records (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id     UUID REFERENCES users(id),
    diagnosis     TEXT NOT NULL,
    treatment     TEXT,
    notes         TEXT,
    record_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. BLOCKCHAIN LEDGER
-- ============================================================
CREATE TABLE IF NOT EXISTS blocks (
    id            SERIAL PRIMARY KEY,
    block_hash    VARCHAR(64) NOT NULL UNIQUE,
    prev_hash     VARCHAR(64) NOT NULL,
    merkle_root   VARCHAR(64),
    nonce         BIGINT,
    height        INTEGER NOT NULL,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id      INTEGER REFERENCES blocks(id),
    entry_hash    VARCHAR(64) NOT NULL UNIQUE,
    record_type   VARCHAR(50) NOT NULL,
    payload       JSONB NOT NULL,
    patient_id    UUID REFERENCES patients(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID REFERENCES users(id),
    action        VARCHAR(100) NOT NULL,
    entity        VARCHAR(50),
    entity_id     VARCHAR(64),
    ip_address    VARCHAR(45),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_ledger_patient ON ledger_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Roles
INSERT INTO roles (name, description) VALUES
    ('admin',    'System administrator with full access'),
    ('doctor',   'Medical practitioner who creates records'),
    ('patient',  'Patient with read-only access to own data'),
    ('auditor',  'Read-only compliance auditor')
ON CONFLICT (name) DO NOTHING;

-- Users (passwords hashed with pgcrypto for demo: "Smile@2026")
INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES
    ('admin01',  'admin@smile.health',   crypt('Smile@2026', gen_salt('bf')), 'Alice Nguyen', 1),
    ('dr.smith', 'smith@smile.health',   crypt('Smile@2026', gen_salt('bf')), 'Dr. John Smith', 2),
    ('dr.lee',   'lee@smile.health',     crypt('Smile@2026', gen_salt('bf')), 'Dr. Mei Lee', 2),
    ('pat.joe',  'joe@smile.health',     crypt('Smile@2026', gen_salt('bf')), 'Joe Brown', 3),
    ('audit01',  'audit@smile.health',   crypt('Smile@2026', gen_salt('bf')), 'Carol White', 4)
ON CONFLICT (username) DO NOTHING;

-- Patients
INSERT INTO patients (patient_code, full_name, date_of_birth, gender, blood_type, phone, address) VALUES
    ('P-00001', 'Joe Brown',     '1985-04-12', 'male',   'O+',  '0901234567', '12 Tran Hung Dao, HCMC'),
    ('P-00002', 'Emma Davis',    '1992-09-30', 'female', 'A-',  '0902345678', '45 Le Loi, Hanoi'),
    ('P-00003', 'Liam Wilson',   '1978-01-22', 'male',   'B+',  '0903456789', '8 Nguyen Hue, Da Nang')
ON CONFLICT (patient_code) DO NOTHING;

-- Medical records
INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, notes) VALUES
    ((SELECT id FROM patients WHERE patient_code='P-00001'),
     (SELECT id FROM users WHERE username='dr.smith'),
     'Hypertension stage 1', 'Lifestyle change + Amlodipine 5mg', 'Follow up in 3 months'),
    ((SELECT id FROM patients WHERE patient_code='P-00002'),
     (SELECT id FROM users WHERE username='dr.lee'),
     'Acute bronchitis', 'Rest, fluids, antibiotics', 'Allergic to penicillin'),
    ((SELECT id FROM patients WHERE patient_code='P-00003'),
     (SELECT id FROM users WHERE username='dr.smith'),
     'Type 2 diabetes', 'Metformin 500mg twice daily', 'Monitor blood glucose weekly');

-- Genesis block
INSERT INTO blocks (block_hash, prev_hash, merkle_root, nonce, height) VALUES
    ('0' || repeat('0',63), '0' || repeat('0',63), 'genesis', 0, 0);

-- Ledger entries (immutable medical record hashes)
INSERT INTO ledger_entries (block_id, entry_hash, record_type, payload, patient_id) VALUES
    (1, md5('P-00001' || NOW()::text), 'MEDICAL_RECORD',
        '{"diagnosis":"Hypertension stage 1"}'::jsonb,
        (SELECT id FROM patients WHERE patient_code='P-00001')),
    (1, md5('P-00002' || NOW()::text), 'MEDICAL_RECORD',
        '{"diagnosis":"Acute bronchitis"}'::jsonb,
        (SELECT id FROM patients WHERE patient_code='P-00002'));

-- Audit logs
INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address) VALUES
    ((SELECT id FROM users WHERE username='admin01'), 'LOGIN', 'users', NULL, '127.0.0.1'),
    ((SELECT id FROM users WHERE username='dr.smith'), 'CREATE', 'medical_records', NULL, '192.168.1.10'),
    ((SELECT id FROM users WHERE username='audit01'), 'VIEW', 'ledger_entries', NULL, '192.168.1.20');
