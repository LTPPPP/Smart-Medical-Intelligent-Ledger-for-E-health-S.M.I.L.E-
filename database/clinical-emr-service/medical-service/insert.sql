--
-- PostgreSQL database dump
--

\restrict WftdAsicmdSomEP46HhhguaKg8gWXTkGeZAMW58ymncrNnCCLaRenqHXjWwBq7T

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
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, ward, district, city, emergency_contact, emergency_phone, blood_type, allergies, chronic_diseases, insurance_number, insurance_provider, created_at, updated_at) VALUES ('a3000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440004', 'PT-000001', 'Nguyễn Văn An', '1990-04-12', 'male', '0901000001', 'patient1@smile.com', NULL, NULL, NULL, 'Hồ Chí Minh', NULL, NULL, 'O+', NULL, NULL, NULL, NULL, '2026-07-14 10:15:48.510058', '2026-07-14 10:15:48.510058') ON CONFLICT DO NOTHING;
INSERT INTO public.patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, ward, district, city, emergency_contact, emergency_phone, blood_type, allergies, chronic_diseases, insurance_number, insurance_provider, created_at, updated_at) VALUES ('a3000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440005', 'PT-000002', 'Trần Thị Bình', '1995-09-23', 'female', '0901000002', 'patient2@smile.com', NULL, NULL, NULL, 'Hà Nội', NULL, NULL, 'A+', NULL, NULL, NULL, NULL, '2026-07-14 10:15:48.51152', '2026-07-14 10:15:48.51152') ON CONFLICT DO NOTHING;
INSERT INTO public.patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, ward, district, city, emergency_contact, emergency_phone, blood_type, allergies, chronic_diseases, insurance_number, insurance_provider, created_at, updated_at) VALUES ('a3000000-0000-0000-0000-000000000003', NULL, 'PT-000003', 'Lê Hoàng Cường', '1988-01-30', 'male', '0901000003', 'cuong.le@example.com', NULL, NULL, NULL, 'Hồ Chí Minh', NULL, NULL, 'B+', NULL, NULL, NULL, NULL, '2026-07-14 10:15:48.511851', '2026-07-14 10:15:48.511851') ON CONFLICT DO NOTHING;
INSERT INTO public.patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, ward, district, city, emergency_contact, emergency_phone, blood_type, allergies, chronic_diseases, insurance_number, insurance_provider, created_at, updated_at) VALUES ('a3000000-0000-0000-0000-000000000004', NULL, 'PT-000004', 'Phạm Thị Dung', '2000-07-15', 'female', '0901000004', 'dung.pham@example.com', NULL, NULL, NULL, 'Hà Nội', NULL, NULL, 'AB+', NULL, NULL, NULL, NULL, '2026-07-14 10:15:48.512168', '2026-07-14 10:15:48.512168') ON CONFLICT DO NOTHING;
INSERT INTO public.patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, ward, district, city, emergency_contact, emergency_phone, blood_type, allergies, chronic_diseases, insurance_number, insurance_provider, created_at, updated_at) VALUES ('a3000000-0000-0000-0000-000000000005', NULL, 'PT-000005', 'Võ Minh Em', '1975-12-02', 'male', '0901000005', 'em.vo@example.com', NULL, NULL, NULL, 'Hồ Chí Minh', NULL, NULL, 'O-', NULL, NULL, NULL, NULL, '2026-07-14 10:15:48.512441', '2026-07-14 10:15:48.512441') ON CONFLICT DO NOTHING;


--
-- Data for Name: medical_records; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('a4000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', '2026-07-03', 'Đau răng hàm dưới', 'Sâu răng số 36', 'Trám răng composite', NULL, 'finalized', NULL, '2026-07-04 00:00:00', '550e8400-e29b-41d4-a716-446655440001', '2026-07-14 10:15:48.512864', '2026-07-14 10:15:48.512864') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('a4000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440002', '2026-06-28', 'Chảy máu nướu khi đánh răng', 'Viêm nướu', 'Cạo vôi răng, hướng dẫn vệ sinh', NULL, 'finalized', NULL, '2026-06-29 00:00:00', '550e8400-e29b-41d4-a716-446655440002', '2026-07-14 10:15:48.513653', '2026-07-14 10:15:48.513653') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('a4000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000002', NULL, 'c0000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', '2026-06-23', 'Răng ố vàng', 'Nhiễm màu ngoại sinh', 'Tẩy trắng răng', NULL, 'finalized', NULL, '2026-06-24 00:00:00', '550e8400-e29b-41d4-a716-446655440001', '2026-07-14 10:15:48.513985', '2026-07-14 10:15:48.513985') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('a4000000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000002', NULL, 'c0000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440002', '2026-06-18', 'Đau răng hàm dưới', 'Sâu răng số 36', 'Trám răng composite', NULL, 'finalized', NULL, '2026-06-19 00:00:00', '550e8400-e29b-41d4-a716-446655440002', '2026-07-14 10:15:48.514304', '2026-07-14 10:15:48.514304') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('a4000000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000003', NULL, 'c0000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', '2026-06-13', 'Chảy máu nướu khi đánh răng', 'Viêm nướu', 'Cạo vôi răng, hướng dẫn vệ sinh', NULL, 'finalized', NULL, '2026-06-14 00:00:00', '550e8400-e29b-41d4-a716-446655440001', '2026-07-14 10:15:48.514584', '2026-07-14 10:15:48.514584') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('a4000000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000003', NULL, 'c0000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440002', '2026-06-08', 'Răng ố vàng', 'Nhiễm màu ngoại sinh', 'Tẩy trắng răng', NULL, 'finalized', NULL, '2026-06-09 00:00:00', '550e8400-e29b-41d4-a716-446655440002', '2026-07-14 10:15:48.514892', '2026-07-14 10:15:48.514892') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('a4000000-0000-0000-0000-000000000007', 'a3000000-0000-0000-0000-000000000004', NULL, 'c0000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', '2026-06-03', 'Đau răng hàm dưới', 'Sâu răng số 36', 'Trám răng composite', NULL, 'finalized', NULL, '2026-06-04 00:00:00', '550e8400-e29b-41d4-a716-446655440001', '2026-07-14 10:15:48.515243', '2026-07-14 10:15:48.515243') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('a4000000-0000-0000-0000-000000000008', 'a3000000-0000-0000-0000-000000000004', NULL, 'c0000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440002', '2026-05-29', 'Chảy máu nướu khi đánh răng', 'Viêm nướu', 'Cạo vôi răng, hướng dẫn vệ sinh', NULL, 'finalized', NULL, '2026-05-30 00:00:00', '550e8400-e29b-41d4-a716-446655440002', '2026-07-14 10:15:48.515715', '2026-07-14 10:15:48.515715') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('a4000000-0000-0000-0000-000000000009', 'a3000000-0000-0000-0000-000000000005', NULL, 'c0000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', '2026-05-24', 'Răng ố vàng', 'Nhiễm màu ngoại sinh', 'Tẩy trắng răng', NULL, 'finalized', NULL, '2026-05-25 00:00:00', '550e8400-e29b-41d4-a716-446655440001', '2026-07-14 10:15:48.516237', '2026-07-14 10:15:48.516237') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('a4000000-0000-0000-0000-000000000010', 'a3000000-0000-0000-0000-000000000005', NULL, 'c0000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440002', '2026-05-19', 'Đau răng hàm dưới', 'Sâu răng số 36', 'Trám răng composite', NULL, 'finalized', NULL, '2026-05-20 00:00:00', '550e8400-e29b-41d4-a716-446655440002', '2026-07-14 10:15:48.517078', '2026-07-14 10:15:48.517078') ON CONFLICT DO NOTHING;


--
-- PostgreSQL database dump complete
--

\unrestrict WftdAsicmdSomEP46HhhguaKg8gWXTkGeZAMW58ymncrNnCCLaRenqHXjWwBq7T

