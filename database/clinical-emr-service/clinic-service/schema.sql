--
-- PostgreSQL database dump
--

\restrict 3Pyj5CkjgbtTIJ0JXX0NeBPVxmhlZVGBp9q90pRXJgOwFkGS6I1UBo4hHLqjoSq

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
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: clinic_room_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.clinic_room_type AS ENUM (
    'examination',
    'surgery',
    'imaging'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointment_notification_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_notification_logs (
    log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid NOT NULL,
    notification_type character varying(50) NOT NULL,
    channel character varying(20) DEFAULT 'APP'::character varying NOT NULL,
    status character varying(20) NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    notification_id character varying(100),
    preference_enabled boolean,
    reminder_minutes_before integer,
    last_attempt_at timestamp without time zone,
    next_retry_at timestamp without time zone,
    error_message text,
    read_at timestamp without time zone,
    responded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: appointment_reminder_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_reminder_preferences (
    preference_id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    channel character varying(20) DEFAULT 'APP'::character varying NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    reminder_minutes_before integer DEFAULT 1440 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: appointment_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_status_history (
    history_id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid,
    old_status character varying(20),
    new_status character varying(20),
    changed_by uuid NOT NULL,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    appointment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_code character varying(50) NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    clinic_id uuid,
    room_id uuid,
    service_id uuid,
    appointment_date date NOT NULL,
    appointment_time time without time zone NOT NULL,
    duration_minutes integer DEFAULT 30,
    appointment_type character varying(50),
    status character varying(20) DEFAULT 'scheduled'::character varying,
    chief_complaint text,
    notes text,
    cancellation_reason text,
    cancelled_by uuid,
    cancelled_at timestamp without time zone,
    is_outside_hours boolean DEFAULT false,
    outside_hours_reason text,
    approved_by uuid,
    payment_id uuid,
    payment_status character varying(20) DEFAULT 'unpaid'::character varying,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    occupied_during tsrange GENERATED ALWAYS AS (tsrange((appointment_date + appointment_time), (((appointment_date + appointment_time) + '00:25:00'::interval) + ((COALESCE(duration_minutes, 30))::double precision * '00:01:00'::interval)), '[)'::text)) STORED,
    session_id uuid,
    treatment_plan_id uuid
);


--
-- Name: clinic_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinic_services (
    clinic_service_id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid,
    service_id uuid,
    custom_price numeric(10,2),
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: clinics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinics (
    clinic_id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_name character varying(255) NOT NULL,
    clinic_code character varying(50) NOT NULL,
    address text NOT NULL,
    ward character varying(100),
    district character varying(100),
    city character varying(100),
    phone character varying(20),
    email character varying(255),
    website character varying(255),
    logo_url text,
    operating_hours jsonb,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    license_number character varying(100),
    license_expiry date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: diagnostic_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnostic_orders (
    order_id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    order_code character varying(50) NOT NULL,
    order_type character varying(50) NOT NULL,
    description text,
    priority character varying(20) DEFAULT 'routine'::character varying,
    tooth_number character varying(10),
    area character varying(100),
    status character varying(20) DEFAULT 'ordered'::character varying,
    result_summary text,
    result_attachment_url text,
    notes text,
    ordered_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: doctor_leaves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_leaves (
    leave_id uuid DEFAULT gen_random_uuid() NOT NULL,
    doctor_id uuid NOT NULL,
    leave_type character varying(50),
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying,
    approved_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: doctor_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_schedules (
    schedule_id uuid DEFAULT gen_random_uuid() NOT NULL,
    doctor_id uuid NOT NULL,
    clinic_id uuid,
    shift_id uuid,
    work_date date NOT NULL,
    room_id uuid,
    max_patients integer DEFAULT 20,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: doctor_specialties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_specialties (
    doctor_id uuid NOT NULL,
    specialty_id uuid NOT NULL,
    certification_number character varying(100),
    certified_date date,
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: idempotency_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idempotency_keys (
    idempotency_key character varying(255) NOT NULL,
    method character varying(10) NOT NULL,
    path character varying(512) NOT NULL,
    status character varying(20) DEFAULT 'in_progress'::character varying NOT NULL,
    response_status integer,
    response_body jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL
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
-- Name: schedule_changes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_changes (
    change_id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id uuid,
    changed_by uuid NOT NULL,
    change_type character varying(50) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    reason text,
    approved_by uuid,
    approval_status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: service_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_categories (
    category_id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_name character varying(255) NOT NULL,
    description text,
    parent_category_id uuid,
    is_active boolean DEFAULT true,
    display_order integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    service_id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_code character varying(50) NOT NULL,
    service_name character varying(255) NOT NULL,
    category_id uuid,
    specialty_id uuid,
    description text,
    duration_minutes integer DEFAULT 30,
    base_price numeric(10,2),
    currency character varying(10) DEFAULT 'VND'::character varying,
    is_active boolean DEFAULT true,
    requires_appointment boolean DEFAULT true,
    preparation_instructions text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    required_room_type public.clinic_room_type NOT NULL
);


--
-- Name: specialties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialties (
    specialty_id uuid DEFAULT gen_random_uuid() NOT NULL,
    specialty_name character varying(255) NOT NULL,
    specialty_code character varying(50) NOT NULL,
    description text,
    icon_url text,
    is_active boolean DEFAULT true,
    display_order integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: treatment_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_rooms (
    room_id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid,
    room_name character varying(100) NOT NULL,
    room_code character varying(50) NOT NULL,
    room_type public.clinic_room_type NOT NULL,
    floor_number integer,
    equipment_list jsonb,
    status character varying(20) DEFAULT 'AVAILABLE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: work_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_shifts (
    shift_id uuid DEFAULT gen_random_uuid() NOT NULL,
    shift_name character varying(100) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: appointment_notification_logs appointment_notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_notification_logs
    ADD CONSTRAINT appointment_notification_logs_pkey PRIMARY KEY (log_id);


--
-- Name: appointment_reminder_preferences appointment_reminder_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_reminder_preferences
    ADD CONSTRAINT appointment_reminder_preferences_pkey PRIMARY KEY (preference_id);


--
-- Name: appointment_status_history appointment_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_status_history
    ADD CONSTRAINT appointment_status_history_pkey PRIMARY KEY (history_id);


--
-- Name: appointments appointments_appointment_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_appointment_code_key UNIQUE (appointment_code);


--
-- Name: appointments appointments_doctor_occupied_excl; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_occupied_excl EXCLUDE USING gist (doctor_id WITH =, occupied_during WITH &&) WHERE (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'confirmed'::character varying, 'checked_in'::character varying, 'in_progress'::character varying])::text[])));


--
-- Name: appointments appointments_patient_occupied_excl; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_occupied_excl EXCLUDE USING gist (patient_id WITH =, occupied_during WITH &&) WHERE (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'confirmed'::character varying, 'checked_in'::character varying, 'in_progress'::character varying])::text[])));


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- Name: appointments appointments_room_occupied_excl; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_room_occupied_excl EXCLUDE USING gist (room_id WITH =, occupied_during WITH &&) WHERE (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'confirmed'::character varying, 'checked_in'::character varying, 'in_progress'::character varying])::text[])));


--
-- Name: clinic_services clinic_services_clinic_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_services
    ADD CONSTRAINT clinic_services_clinic_id_service_id_key UNIQUE (clinic_id, service_id);


--
-- Name: clinic_services clinic_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_services
    ADD CONSTRAINT clinic_services_pkey PRIMARY KEY (clinic_service_id);


--
-- Name: clinics clinics_clinic_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_clinic_code_key UNIQUE (clinic_code);


--
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (clinic_id);


--
-- Name: diagnostic_orders diagnostic_orders_order_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_orders
    ADD CONSTRAINT diagnostic_orders_order_code_key UNIQUE (order_code);


--
-- Name: diagnostic_orders diagnostic_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_orders
    ADD CONSTRAINT diagnostic_orders_pkey PRIMARY KEY (order_id);


--
-- Name: doctor_leaves doctor_leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_leaves
    ADD CONSTRAINT doctor_leaves_pkey PRIMARY KEY (leave_id);


--
-- Name: doctor_schedules doctor_schedules_doctor_id_work_date_shift_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_doctor_id_work_date_shift_id_key UNIQUE (doctor_id, work_date, shift_id);


--
-- Name: doctor_schedules doctor_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_pkey PRIMARY KEY (schedule_id);


--
-- Name: doctor_specialties doctor_specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_specialties
    ADD CONSTRAINT doctor_specialties_pkey PRIMARY KEY (doctor_id, specialty_id);


--
-- Name: idempotency_keys idempotency_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (idempotency_key);


--
-- Name: schedule_changes schedule_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_changes
    ADD CONSTRAINT schedule_changes_pkey PRIMARY KEY (change_id);


--
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (category_id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (service_id);


--
-- Name: services services_service_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_service_code_key UNIQUE (service_code);


--
-- Name: specialties specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_pkey PRIMARY KEY (specialty_id);


--
-- Name: specialties specialties_specialty_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_specialty_code_key UNIQUE (specialty_code);


--
-- Name: treatment_rooms treatment_rooms_clinic_id_room_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_rooms
    ADD CONSTRAINT treatment_rooms_clinic_id_room_code_key UNIQUE (clinic_id, room_code);


--
-- Name: treatment_rooms treatment_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_rooms
    ADD CONSTRAINT treatment_rooms_pkey PRIMARY KEY (room_id);


--
-- Name: appointment_reminder_preferences uq_reminder_preferences_patient_channel; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_reminder_preferences
    ADD CONSTRAINT uq_reminder_preferences_patient_channel UNIQUE (patient_id, channel);


--
-- Name: work_shifts work_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_shifts
    ADD CONSTRAINT work_shifts_pkey PRIMARY KEY (shift_id);


--
-- Name: idx_appointment_history_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_history_id ON public.appointment_status_history USING btree (appointment_id);


--
-- Name: idx_appointment_notification_logs_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointment_notification_logs_appointment ON public.appointment_notification_logs USING btree (appointment_id);


--
-- Name: idx_appointments_doctor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_doctor ON public.appointments USING btree (doctor_id, appointment_date);


--
-- Name: idx_appointments_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_patient ON public.appointments USING btree (patient_id, appointment_date);


--
-- Name: idx_appointments_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_session_id ON public.appointments USING btree (session_id);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status, appointment_date);


--
-- Name: idx_appointments_treatment_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_treatment_plan_id ON public.appointments USING btree (treatment_plan_id);


--
-- Name: idx_clinics_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_code ON public.clinics USING btree (clinic_code);


--
-- Name: idx_diagnostic_orders_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diagnostic_orders_appointment ON public.diagnostic_orders USING btree (appointment_id);


--
-- Name: idx_diagnostic_orders_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diagnostic_orders_code ON public.diagnostic_orders USING btree (order_code);


--
-- Name: idx_doctor_specialties_doctor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_specialties_doctor ON public.doctor_specialties USING btree (doctor_id);


--
-- Name: idx_idempotency_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_idempotency_expires ON public.idempotency_keys USING btree (expires_at);


--
-- Name: idx_rooms_clinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rooms_clinic ON public.treatment_rooms USING btree (clinic_id);


--
-- Name: idx_schedules_clinic_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_clinic_date ON public.doctor_schedules USING btree (clinic_id, work_date);


--
-- Name: idx_schedules_doctor_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_doctor_date ON public.doctor_schedules USING btree (doctor_id, work_date);


--
-- Name: appointment_notification_logs appointment_notification_logs_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_notification_logs
    ADD CONSTRAINT appointment_notification_logs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE CASCADE;


--
-- Name: appointment_status_history appointment_status_history_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_status_history
    ADD CONSTRAINT appointment_status_history_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE CASCADE;


--
-- Name: appointments appointments_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: appointments appointments_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.treatment_rooms(room_id);


--
-- Name: appointments appointments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id);


--
-- Name: clinic_services clinic_services_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_services
    ADD CONSTRAINT clinic_services_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: clinic_services clinic_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_services
    ADD CONSTRAINT clinic_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id) ON DELETE CASCADE;


--
-- Name: diagnostic_orders diagnostic_orders_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_orders
    ADD CONSTRAINT diagnostic_orders_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE CASCADE;


--
-- Name: doctor_schedules doctor_schedules_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: doctor_schedules doctor_schedules_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.treatment_rooms(room_id);


--
-- Name: doctor_schedules doctor_schedules_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.work_shifts(shift_id);


--
-- Name: doctor_specialties doctor_specialties_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_specialties
    ADD CONSTRAINT doctor_specialties_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(specialty_id) ON DELETE CASCADE;


--
-- Name: schedule_changes schedule_changes_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_changes
    ADD CONSTRAINT schedule_changes_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.doctor_schedules(schedule_id) ON DELETE CASCADE;


--
-- Name: service_categories service_categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.service_categories(category_id);


--
-- Name: services services_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(category_id);


--
-- Name: services services_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(specialty_id);


--
-- Name: treatment_rooms treatment_rooms_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_rooms
    ADD CONSTRAINT treatment_rooms_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 3Pyj5CkjgbtTIJ0JXX0NeBPVxmhlZVGBp9q90pRXJgOwFkGS6I1UBo4hHLqjoSq

