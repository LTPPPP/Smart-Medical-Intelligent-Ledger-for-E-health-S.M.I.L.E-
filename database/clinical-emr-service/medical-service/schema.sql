--
-- PostgreSQL database dump
--

\restrict 3pGNQSW4ezjBAUCgf9IKO5B6HS0hwOpEoIX6k6phxpzyAnFBiZdWrJD3OVHxLVF

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clinical_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_orders (
    order_id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    record_id uuid,
    patient_id uuid,
    ordered_by uuid NOT NULL,
    order_type character varying(50) NOT NULL,
    test_type character varying(100) NOT NULL,
    clinical_indication text,
    teeth_numbers integer[],
    urgency character varying(20) DEFAULT 'routine'::character varying,
    status character varying(20) DEFAULT 'ordered'::character varying,
    ordered_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    scheduled_date timestamp without time zone,
    completed_date timestamp without time zone,
    result_url text,
    report text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: dental_charts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dental_charts (
    chart_id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    record_id uuid,
    tooth_number integer NOT NULL,
    tooth_status character varying(50),
    surfaces jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: dental_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dental_images (
    image_id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    record_id uuid,
    category_id uuid,
    image_type character varying(50) NOT NULL,
    image_url text NOT NULL,
    thumbnail_url text,
    file_size_kb integer,
    file_format character varying(10),
    tooth_numbers integer[],
    view_angle character varying(50),
    description text,
    tags text[],
    metadata jsonb,
    pacs_id character varying(255),
    taken_date date,
    taken_by uuid,
    uploaded_by uuid NOT NULL,
    is_archived boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: diagnoses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnoses (
    diagnosis_id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    icd_code character varying(20),
    diagnosis_name character varying(255) NOT NULL,
    diagnosis_type character varying(50),
    severity character varying(20),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: examination_session_amendments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examination_session_amendments (
    amendment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    record_id uuid,
    patient_id uuid,
    doctor_id uuid NOT NULL,
    amendment_reason text NOT NULL,
    amendment_text text NOT NULL,
    amended_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: examination_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examination_sessions (
    session_id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid,
    record_id uuid,
    patient_id uuid,
    doctor_id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    session_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    chief_complaint text,
    present_illness text,
    physical_examination text,
    vital_signs jsonb,
    status character varying(20) DEFAULT 'in_progress'::character varying,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    signed_at timestamp without time zone,
    signed_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: file; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    path character varying NOT NULL
);


--
-- Name: image_annotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image_annotations (
    annotation_id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_id uuid,
    annotated_by uuid NOT NULL,
    annotation_type character varying(50),
    annotation_data jsonb,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: image_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image_categories (
    category_id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: lab_test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_test_results (
    result_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    test_name character varying(255) NOT NULL,
    result_value text,
    result_unit character varying(50),
    reference_range character varying(100),
    is_abnormal boolean DEFAULT false,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: medical_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_history (
    history_id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    condition_name character varying(255) NOT NULL,
    condition_type character varying(50),
    diagnosed_date date,
    treatment text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: medical_record_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_record_versions (
    version_id uuid DEFAULT gen_random_uuid() NOT NULL,
    record_id uuid,
    version_number integer NOT NULL,
    snapshot jsonb NOT NULL,
    changed_by uuid NOT NULL,
    change_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: medical_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_records (
    record_id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    appointment_id uuid,
    clinic_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    visit_date date NOT NULL,
    chief_complaint text,
    diagnosis text,
    treatment_plan text,
    notes text,
    record_status character varying(20) DEFAULT 'draft'::character varying,
    record_hash character varying(255),
    finalized_at timestamp without time zone,
    finalized_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: pacs_sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pacs_sync_logs (
    sync_id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_id uuid,
    sync_type character varying(50),
    pacs_server character varying(255),
    status character varying(20),
    error_message text,
    synced_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: patient_representatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_representatives (
    representative_id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    full_name character varying(255) NOT NULL,
    relationship character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    legal_document_type character varying(50),
    legal_document_number character varying(100),
    is_primary boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    authorized_for_treatment boolean DEFAULT false NOT NULL,
    authorized_for_payment boolean DEFAULT false NOT NULL,
    authorized_for_records boolean DEFAULT false NOT NULL,
    verified_at timestamp without time zone,
    verified_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    patient_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    patient_code character varying(50) NOT NULL,
    full_name character varying(255) NOT NULL,
    date_of_birth date,
    gender character varying(10),
    phone character varying(20),
    email character varying(255),
    address text,
    ward character varying(100),
    district character varying(100),
    city character varying(100),
    emergency_contact character varying(255),
    emergency_phone character varying(20),
    blood_type character varying(10),
    allergies text[],
    chronic_diseases text[],
    insurance_number character varying(100),
    insurance_provider character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: prescription_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescription_items (
    item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    prescription_id uuid,
    medication_name character varying(255) NOT NULL,
    medication_code character varying(50),
    dosage character varying(100) NOT NULL,
    route character varying(50),
    frequency character varying(100) NOT NULL,
    duration_days integer,
    quantity integer,
    instructions text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescriptions (
    prescription_id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    record_id uuid,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    prescription_date date DEFAULT CURRENT_DATE NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    notes text,
    digital_signature_id uuid,
    issued_at timestamp without time zone,
    issued_by uuid,
    cancelled_at timestamp without time zone,
    cancellation_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    minor_patient_at_issue boolean,
    patient_age_years_at_issue integer,
    patient_age_months_at_issue integer,
    representative_name_snapshot character varying(255),
    representative_phone_snapshot character varying(20),
    representative_id_snapshot uuid,
    representative_relationship_snapshot character varying(100)
);


--
-- Name: record_exports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.record_exports (
    export_id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    record_id uuid,
    export_type character varying(50),
    export_format character varying(20),
    file_url text,
    exported_by uuid NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    id integer NOT NULL,
    name character varying NOT NULL
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    id integer NOT NULL,
    hash character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    "userId" integer
);


--
-- Name: session_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_id_seq OWNED BY public.session.id;


--
-- Name: status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status (
    id integer NOT NULL,
    name character varying NOT NULL
);


--
-- Name: symptoms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.symptoms (
    symptom_id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    patient_id uuid,
    symptom_name character varying(255) NOT NULL,
    body_location character varying(100),
    severity character varying(20),
    onset_date date,
    duration character varying(100),
    description text,
    recorded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: treatment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_history (
    treatment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    record_id uuid,
    patient_id uuid,
    treatment_date date NOT NULL,
    tooth_numbers integer[],
    procedure_code character varying(50),
    procedure_name character varying(255) NOT NULL,
    description text,
    cost numeric(10,2),
    status character varying(20) DEFAULT 'completed'::character varying,
    performed_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: treatment_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_plans (
    plan_id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    patient_id uuid,
    record_id uuid,
    plan_name character varying(255),
    objectives text,
    duration_weeks integer,
    status character varying(20) DEFAULT 'draft'::character varying,
    estimated_cost numeric(12,2),
    quote_currency character varying(3),
    sent_at timestamp without time zone,
    sent_to uuid,
    sent_via character varying(20),
    confirmed_at timestamp without time zone,
    proposed_at timestamp without time zone,
    accepted_at timestamp without time zone,
    accepted_by uuid,
    declined_at timestamp without time zone,
    declined_by uuid,
    decline_reason text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    quote_version character varying(100),
    risk_disclosure text,
    alternative_options text,
    acceptance_scope character varying(20),
    accepted_scope_note text,
    accepted_representative_id uuid,
    accepted_representative_name character varying(255),
    accepted_representative_relationship character varying(100),
    accepted_representative_phone character varying(20)
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    email character varying,
    password character varying,
    provider character varying DEFAULT 'email'::character varying NOT NULL,
    "socialId" character varying,
    "firstName" character varying,
    "lastName" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    "photoId" uuid,
    "roleId" integer,
    "statusId" integer
);


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: session id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session ALTER COLUMN id SET DEFAULT nextval('public.session_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: file PK_36b46d232307066b3a2c9ea3a1d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file
    ADD CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: role PK_b36bcfe02fc8de3c57a8b2391c2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY (id);


--
-- Name: user PK_cace4a159ff9f2512dd42373760; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);


--
-- Name: status PK_e12743a7086ec826733f54e1d95; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT "PK_e12743a7086ec826733f54e1d95" PRIMARY KEY (id);


--
-- Name: session PK_f55da76ac1c3ac420f444d2ff11; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY (id);


--
-- Name: user REL_75e2be4ce11d447ef43be0e374; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "REL_75e2be4ce11d447ef43be0e374" UNIQUE ("photoId");


--
-- Name: user UQ_e12875dfb3b1d92d7d7c5377e22; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE (email);


--
-- Name: clinical_orders clinical_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_orders
    ADD CONSTRAINT clinical_orders_pkey PRIMARY KEY (order_id);


--
-- Name: dental_charts dental_charts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_charts
    ADD CONSTRAINT dental_charts_pkey PRIMARY KEY (chart_id);


--
-- Name: dental_charts dental_charts_record_id_tooth_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_charts
    ADD CONSTRAINT dental_charts_record_id_tooth_number_key UNIQUE (record_id, tooth_number);


--
-- Name: dental_images dental_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_images
    ADD CONSTRAINT dental_images_pkey PRIMARY KEY (image_id);


--
-- Name: diagnoses diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_pkey PRIMARY KEY (diagnosis_id);


--
-- Name: examination_session_amendments examination_session_amendments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examination_session_amendments
    ADD CONSTRAINT examination_session_amendments_pkey PRIMARY KEY (amendment_id);


--
-- Name: examination_sessions examination_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examination_sessions
    ADD CONSTRAINT examination_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: image_annotations image_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_annotations
    ADD CONSTRAINT image_annotations_pkey PRIMARY KEY (annotation_id);


--
-- Name: image_categories image_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_categories
    ADD CONSTRAINT image_categories_pkey PRIMARY KEY (category_id);


--
-- Name: lab_test_results lab_test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_results
    ADD CONSTRAINT lab_test_results_pkey PRIMARY KEY (result_id);


--
-- Name: medical_history medical_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_pkey PRIMARY KEY (history_id);


--
-- Name: medical_record_versions medical_record_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_record_versions
    ADD CONSTRAINT medical_record_versions_pkey PRIMARY KEY (version_id);


--
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (record_id);


--
-- Name: pacs_sync_logs pacs_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacs_sync_logs
    ADD CONSTRAINT pacs_sync_logs_pkey PRIMARY KEY (sync_id);


--
-- Name: patient_representatives patient_representatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_representatives
    ADD CONSTRAINT patient_representatives_pkey PRIMARY KEY (representative_id);


--
-- Name: patients patients_patient_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_code_key UNIQUE (patient_code);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (patient_id);


--
-- Name: prescription_items prescription_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_pkey PRIMARY KEY (item_id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (prescription_id);


--
-- Name: record_exports record_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_exports
    ADD CONSTRAINT record_exports_pkey PRIMARY KEY (export_id);


--
-- Name: symptoms symptoms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_pkey PRIMARY KEY (symptom_id);


--
-- Name: treatment_history treatment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_history
    ADD CONSTRAINT treatment_history_pkey PRIMARY KEY (treatment_id);


--
-- Name: treatment_plans treatment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_pkey PRIMARY KEY (plan_id);


--
-- Name: IDX_3d2f174ef04fb312fdebd0ddc5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON public.session USING btree ("userId");


--
-- Name: IDX_58e4dbff0e1a32a9bdc861bb29; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_58e4dbff0e1a32a9bdc861bb29" ON public."user" USING btree ("firstName");


--
-- Name: IDX_9bd2fe7a8e694dedc4ec2f666f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9bd2fe7a8e694dedc4ec2f666f" ON public."user" USING btree ("socialId");


--
-- Name: IDX_f0e1b4ecdca13b177e2e3a0613; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f0e1b4ecdca13b177e2e3a0613" ON public."user" USING btree ("lastName");


--
-- Name: idx_clinical_orders_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_orders_patient ON public.clinical_orders USING btree (patient_id, status);


--
-- Name: idx_clinical_orders_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_orders_session ON public.clinical_orders USING btree (session_id);


--
-- Name: idx_dental_charts_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_charts_record ON public.dental_charts USING btree (record_id);


--
-- Name: idx_exam_amendments_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_amendments_record ON public.examination_session_amendments USING btree (record_id);


--
-- Name: idx_exam_amendments_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_amendments_session ON public.examination_session_amendments USING btree (session_id);


--
-- Name: idx_exam_sessions_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_sessions_appointment ON public.examination_sessions USING btree (appointment_id);


--
-- Name: idx_exam_sessions_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_sessions_record ON public.examination_sessions USING btree (record_id);


--
-- Name: idx_images_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_patient ON public.dental_images USING btree (patient_id, taken_date);


--
-- Name: idx_images_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_type ON public.dental_images USING btree (image_type);


--
-- Name: idx_patient_representatives_authorized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_representatives_authorized ON public.patient_representatives USING btree (patient_id, is_active, is_primary);


--
-- Name: idx_patient_representatives_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_representatives_patient ON public.patient_representatives USING btree (patient_id);


--
-- Name: idx_patients_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_code ON public.patients USING btree (patient_code);


--
-- Name: idx_prescriptions_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescriptions_patient ON public.prescriptions USING btree (patient_id, prescription_date);


--
-- Name: idx_prescriptions_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescriptions_session ON public.prescriptions USING btree (session_id);


--
-- Name: idx_record_exports_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_record_exports_patient ON public.record_exports USING btree (patient_id);


--
-- Name: idx_record_versions_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_record_versions_record ON public.medical_record_versions USING btree (record_id);


--
-- Name: idx_records_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_records_patient ON public.medical_records USING btree (patient_id, visit_date);


--
-- Name: idx_symptoms_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_symptoms_session ON public.symptoms USING btree (session_id);


--
-- Name: idx_treatment_plans_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatment_plans_session ON public.treatment_plans USING btree (session_id);


--
-- Name: session FK_3d2f174ef04fb312fdebd0ddc53; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: user FK_75e2be4ce11d447ef43be0e374f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "FK_75e2be4ce11d447ef43be0e374f" FOREIGN KEY ("photoId") REFERENCES public.file(id);


--
-- Name: user FK_c28e52f758e7bbc53828db92194; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES public.role(id);


--
-- Name: user FK_dc18daa696860586ba4667a9d31; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "FK_dc18daa696860586ba4667a9d31" FOREIGN KEY ("statusId") REFERENCES public.status(id);


--
-- Name: clinical_orders clinical_orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_orders
    ADD CONSTRAINT clinical_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: clinical_orders clinical_orders_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_orders
    ADD CONSTRAINT clinical_orders_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(record_id) ON DELETE CASCADE;


--
-- Name: clinical_orders clinical_orders_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_orders
    ADD CONSTRAINT clinical_orders_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.examination_sessions(session_id) ON DELETE CASCADE;


--
-- Name: dental_charts dental_charts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_charts
    ADD CONSTRAINT dental_charts_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: dental_charts dental_charts_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_charts
    ADD CONSTRAINT dental_charts_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(record_id) ON DELETE CASCADE;


--
-- Name: dental_images dental_images_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_images
    ADD CONSTRAINT dental_images_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.image_categories(category_id);


--
-- Name: dental_images dental_images_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_images
    ADD CONSTRAINT dental_images_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: dental_images dental_images_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_images
    ADD CONSTRAINT dental_images_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(record_id);


--
-- Name: diagnoses diagnoses_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.examination_sessions(session_id) ON DELETE CASCADE;


--
-- Name: examination_session_amendments exam_amendments_record_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examination_session_amendments
    ADD CONSTRAINT exam_amendments_record_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(record_id) ON DELETE SET NULL;


--
-- Name: examination_session_amendments exam_amendments_session_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examination_session_amendments
    ADD CONSTRAINT exam_amendments_session_fkey FOREIGN KEY (session_id) REFERENCES public.examination_sessions(session_id) ON DELETE CASCADE;


--
-- Name: examination_sessions examination_sessions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examination_sessions
    ADD CONSTRAINT examination_sessions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: examination_sessions examination_sessions_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examination_sessions
    ADD CONSTRAINT examination_sessions_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(record_id) ON DELETE CASCADE;


--
-- Name: clinical_orders fk_clinical_orders_session; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_orders
    ADD CONSTRAINT fk_clinical_orders_session FOREIGN KEY (session_id) REFERENCES public.examination_sessions(session_id) ON DELETE CASCADE;


--
-- Name: prescriptions fk_prescriptions_session; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT fk_prescriptions_session FOREIGN KEY (session_id) REFERENCES public.examination_sessions(session_id) ON DELETE CASCADE;


--
-- Name: treatment_plans fk_treatment_plans_session; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT fk_treatment_plans_session FOREIGN KEY (session_id) REFERENCES public.examination_sessions(session_id) ON DELETE CASCADE;


--
-- Name: image_annotations image_annotations_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_annotations
    ADD CONSTRAINT image_annotations_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.dental_images(image_id) ON DELETE CASCADE;


--
-- Name: lab_test_results lab_test_results_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_results
    ADD CONSTRAINT lab_test_results_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.clinical_orders(order_id) ON DELETE CASCADE;


--
-- Name: medical_history medical_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_history
    ADD CONSTRAINT medical_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: medical_record_versions medical_record_versions_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_record_versions
    ADD CONSTRAINT medical_record_versions_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(record_id) ON DELETE CASCADE;


--
-- Name: medical_records medical_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: pacs_sync_logs pacs_sync_logs_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacs_sync_logs
    ADD CONSTRAINT pacs_sync_logs_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.dental_images(image_id);


--
-- Name: patient_representatives patient_representatives_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_representatives
    ADD CONSTRAINT patient_representatives_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: prescription_items prescription_items_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(prescription_id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: prescriptions prescriptions_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(record_id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.examination_sessions(session_id) ON DELETE CASCADE;


--
-- Name: record_exports record_exports_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_exports
    ADD CONSTRAINT record_exports_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: record_exports record_exports_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_exports
    ADD CONSTRAINT record_exports_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(record_id) ON DELETE CASCADE;


--
-- Name: symptoms symptoms_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: symptoms symptoms_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.examination_sessions(session_id) ON DELETE CASCADE;


--
-- Name: treatment_history treatment_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_history
    ADD CONSTRAINT treatment_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: treatment_history treatment_history_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_history
    ADD CONSTRAINT treatment_history_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(record_id) ON DELETE CASCADE;


--
-- Name: treatment_plans treatment_plans_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: treatment_plans treatment_plans_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(record_id);


--
-- Name: treatment_plans treatment_plans_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.examination_sessions(session_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 3pGNQSW4ezjBAUCgf9IKO5B6HS0hwOpEoIX6k6phxpzyAnFBiZdWrJD3OVHxLVF

