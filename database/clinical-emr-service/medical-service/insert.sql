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

INSERT INTO public.patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, ward, district, city, emergency_contact, emergency_phone, blood_type, allergies, chronic_diseases, insurance_number, insurance_provider, created_at, updated_at) VALUES ('243c51bc-c036-4cab-bec9-58caac08eacc', '00e1cbd4-6862-4ebe-9cac-9c17b6a20ed4', 'PT-000001', 'Nguyễn Văn An', '1990-04-12', 'male', '0901000001', 'patient1@smile.com', NULL, NULL, NULL, 'Hồ Chí Minh', NULL, NULL, 'O+', NULL, NULL, NULL, NULL, '2026-07-14 10:15:48.510058', '2026-07-14 10:15:48.510058') ON CONFLICT DO NOTHING;
INSERT INTO public.patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, ward, district, city, emergency_contact, emergency_phone, blood_type, allergies, chronic_diseases, insurance_number, insurance_provider, created_at, updated_at) VALUES ('33743d6f-5455-455c-85b3-50dfb3051400', 'c81c963c-80a4-4f6d-8738-615e076c5c05', 'PT-000002', 'Trần Thị Bình', '1995-09-23', 'female', '0901000002', 'patient2@smile.com', NULL, NULL, NULL, 'Hà Nội', NULL, NULL, 'A+', NULL, NULL, NULL, NULL, '2026-07-14 10:15:48.51152', '2026-07-14 10:15:48.51152') ON CONFLICT DO NOTHING;
INSERT INTO public.patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, ward, district, city, emergency_contact, emergency_phone, blood_type, allergies, chronic_diseases, insurance_number, insurance_provider, created_at, updated_at) VALUES ('7c1716fe-3f81-42fe-8a8f-d2d9a86d6430', NULL, 'PT-000003', 'Lê Hoàng Cường', '1988-01-30', 'male', '0901000003', 'cuong.le@example.com', NULL, NULL, NULL, 'Hồ Chí Minh', NULL, NULL, 'B+', NULL, NULL, NULL, NULL, '2026-07-14 10:15:48.511851', '2026-07-14 10:15:48.511851') ON CONFLICT DO NOTHING;
INSERT INTO public.patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, ward, district, city, emergency_contact, emergency_phone, blood_type, allergies, chronic_diseases, insurance_number, insurance_provider, created_at, updated_at) VALUES ('f3ab6ca1-ad51-4e67-9222-6b55eb414f77', NULL, 'PT-000004', 'Phạm Thị Dung', '2000-07-15', 'female', '0901000004', 'dung.pham@example.com', NULL, NULL, NULL, 'Hà Nội', NULL, NULL, 'AB+', NULL, NULL, NULL, NULL, '2026-07-14 10:15:48.512168', '2026-07-14 10:15:48.512168') ON CONFLICT DO NOTHING;
INSERT INTO public.patients (patient_id, user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, ward, district, city, emergency_contact, emergency_phone, blood_type, allergies, chronic_diseases, insurance_number, insurance_provider, created_at, updated_at) VALUES ('2c6f23dc-c7ff-4fde-b22b-e01d4117910b', NULL, 'PT-000005', 'Võ Minh Em', '1975-12-02', 'male', '0901000005', 'em.vo@example.com', NULL, NULL, NULL, 'Hồ Chí Minh', NULL, NULL, 'O-', NULL, NULL, NULL, NULL, '2026-07-14 10:15:48.512441', '2026-07-14 10:15:48.512441') ON CONFLICT DO NOTHING;


--
-- Data for Name: medical_records; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('bb91f1e4-c467-478a-86ef-c720344fcc62', '243c51bc-c036-4cab-bec9-58caac08eacc', NULL, '259d640a-7e07-4354-827b-e1f465f06b51', 'c8be5977-44f1-4f1c-ad46-58479cd52d37', '2026-07-03', 'Đau răng hàm dưới', 'Sâu răng số 36', 'Trám răng composite', NULL, 'finalized', NULL, '2026-07-04 00:00:00', 'c8be5977-44f1-4f1c-ad46-58479cd52d37', '2026-07-14 10:15:48.512864', '2026-07-14 10:15:48.512864') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('378cf20d-44c1-44ec-8e73-dd64310f7d6a', '243c51bc-c036-4cab-bec9-58caac08eacc', NULL, 'f1e94278-db69-4c4e-b8a4-bea06b1f6fe1', 'c90773ba-3bed-4879-b1fa-d39ca9eee127', '2026-06-28', 'Chảy máu nướu khi đánh răng', 'Viêm nướu', 'Cạo vôi răng, hướng dẫn vệ sinh', NULL, 'finalized', NULL, '2026-06-29 00:00:00', 'c90773ba-3bed-4879-b1fa-d39ca9eee127', '2026-07-14 10:15:48.513653', '2026-07-14 10:15:48.513653') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('64792484-94f1-4fa8-aa63-52710e81a72e', '33743d6f-5455-455c-85b3-50dfb3051400', NULL, '259d640a-7e07-4354-827b-e1f465f06b51', 'c8be5977-44f1-4f1c-ad46-58479cd52d37', '2026-06-23', 'Răng ố vàng', 'Nhiễm màu ngoại sinh', 'Tẩy trắng răng', NULL, 'finalized', NULL, '2026-06-24 00:00:00', 'c8be5977-44f1-4f1c-ad46-58479cd52d37', '2026-07-14 10:15:48.513985', '2026-07-14 10:15:48.513985') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('18e0fbb1-4715-428d-86f7-87f259bc1060', '33743d6f-5455-455c-85b3-50dfb3051400', NULL, 'f1e94278-db69-4c4e-b8a4-bea06b1f6fe1', 'c90773ba-3bed-4879-b1fa-d39ca9eee127', '2026-06-18', 'Đau răng hàm dưới', 'Sâu răng số 36', 'Trám răng composite', NULL, 'finalized', NULL, '2026-06-19 00:00:00', 'c90773ba-3bed-4879-b1fa-d39ca9eee127', '2026-07-14 10:15:48.514304', '2026-07-14 10:15:48.514304') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('f85c7528-dbaf-4e3b-800d-e6f4115ce8ac', '7c1716fe-3f81-42fe-8a8f-d2d9a86d6430', NULL, '259d640a-7e07-4354-827b-e1f465f06b51', 'c8be5977-44f1-4f1c-ad46-58479cd52d37', '2026-06-13', 'Chảy máu nướu khi đánh răng', 'Viêm nướu', 'Cạo vôi răng, hướng dẫn vệ sinh', NULL, 'finalized', NULL, '2026-06-14 00:00:00', 'c8be5977-44f1-4f1c-ad46-58479cd52d37', '2026-07-14 10:15:48.514584', '2026-07-14 10:15:48.514584') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('3a38bd01-4a78-4736-b5bc-7a2455d32979', '7c1716fe-3f81-42fe-8a8f-d2d9a86d6430', NULL, 'f1e94278-db69-4c4e-b8a4-bea06b1f6fe1', 'c90773ba-3bed-4879-b1fa-d39ca9eee127', '2026-06-08', 'Răng ố vàng', 'Nhiễm màu ngoại sinh', 'Tẩy trắng răng', NULL, 'finalized', NULL, '2026-06-09 00:00:00', 'c90773ba-3bed-4879-b1fa-d39ca9eee127', '2026-07-14 10:15:48.514892', '2026-07-14 10:15:48.514892') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('c4b024c6-83fe-4acd-b6d0-344a2373383e', 'f3ab6ca1-ad51-4e67-9222-6b55eb414f77', NULL, '259d640a-7e07-4354-827b-e1f465f06b51', 'c8be5977-44f1-4f1c-ad46-58479cd52d37', '2026-06-03', 'Đau răng hàm dưới', 'Sâu răng số 36', 'Trám răng composite', NULL, 'finalized', NULL, '2026-06-04 00:00:00', 'c8be5977-44f1-4f1c-ad46-58479cd52d37', '2026-07-14 10:15:48.515243', '2026-07-14 10:15:48.515243') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('8795c86f-e548-4b0c-b374-d47331269958', 'f3ab6ca1-ad51-4e67-9222-6b55eb414f77', NULL, 'f1e94278-db69-4c4e-b8a4-bea06b1f6fe1', 'c90773ba-3bed-4879-b1fa-d39ca9eee127', '2026-05-29', 'Chảy máu nướu khi đánh răng', 'Viêm nướu', 'Cạo vôi răng, hướng dẫn vệ sinh', NULL, 'finalized', NULL, '2026-05-30 00:00:00', 'c90773ba-3bed-4879-b1fa-d39ca9eee127', '2026-07-14 10:15:48.515715', '2026-07-14 10:15:48.515715') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('5ab72264-c40b-4b2b-8b97-6ad43e240c0c', '2c6f23dc-c7ff-4fde-b22b-e01d4117910b', NULL, '259d640a-7e07-4354-827b-e1f465f06b51', 'c8be5977-44f1-4f1c-ad46-58479cd52d37', '2026-05-24', 'Răng ố vàng', 'Nhiễm màu ngoại sinh', 'Tẩy trắng răng', NULL, 'finalized', NULL, '2026-05-25 00:00:00', 'c8be5977-44f1-4f1c-ad46-58479cd52d37', '2026-07-14 10:15:48.516237', '2026-07-14 10:15:48.516237') ON CONFLICT DO NOTHING;
INSERT INTO public.medical_records (record_id, patient_id, appointment_id, clinic_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan, notes, record_status, record_hash, finalized_at, finalized_by, created_at, updated_at) VALUES ('667a14b8-c81f-4daf-b956-d0cb89d8b4db', '2c6f23dc-c7ff-4fde-b22b-e01d4117910b', NULL, 'f1e94278-db69-4c4e-b8a4-bea06b1f6fe1', 'c90773ba-3bed-4879-b1fa-d39ca9eee127', '2026-05-19', 'Đau răng hàm dưới', 'Sâu răng số 36', 'Trám răng composite', NULL, 'finalized', NULL, '2026-05-20 00:00:00', 'c90773ba-3bed-4879-b1fa-d39ca9eee127', '2026-07-14 10:15:48.517078', '2026-07-14 10:15:48.517078') ON CONFLICT DO NOTHING;


--
-- PostgreSQL database dump complete
--

\unrestrict WftdAsicmdSomEP46HhhguaKg8gWXTkGeZAMW58ymncrNnCCLaRenqHXjWwBq7T

