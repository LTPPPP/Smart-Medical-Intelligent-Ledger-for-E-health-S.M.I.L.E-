-- ============================================
-- SAMPLE DATA FOR AUTH SERVICE
-- Realistic Vietnamese data with ~100 accounts
-- ============================================

-- Password: "Password123!" for all accounts
-- BCrypt hash: $2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6

-- ADMIN Account
INSERT INTO accounts (account_id, username, email, password_hash, status, email_verified, phone_verified, last_login_at, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:30:00', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- DOCTOR Accounts (10 doctors)
INSERT INTO accounts (account_id, username, email, password_hash, status, email_verified, phone_verified, last_login_at, role) VALUES
('c8be5977-44f1-4f1c-ad46-58479cd52d37', 'dr.nguyenvana', 'dr.nguyenvana@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:15:00', 'DOCTOR'),
('c90773ba-3bed-4879-b1fa-d39ca9eee127', 'dr.tranthib', 'dr.tranthib@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 17:45:00', 'DOCTOR'),
('788965d4-e3e3-451d-bdcb-2577eb6d17fc', 'dr.levanc', 'dr.levanc@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 10:00:00', 'DOCTOR'),
('a1263dc8-5bc9-451a-95dd-242ef757efe4', 'dr.phamthid', 'dr.phamthid@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-20 14:30:00', 'DOCTOR'),
('9d2bf998-10b6-435b-9950-c16682a4fbd1', 'dr.hoangvane', 'dr.hoangvane@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:00:00', 'DOCTOR'),
('61e1c766-cd7b-4978-b635-2999615f4f4a', 'dr.nguyenthif', 'dr.nguyenthif@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-19 16:00:00', 'DOCTOR'),
('ab014405-2237-4646-a20c-af5049173dc2', 'dr.buihuug', 'dr.buihuug@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 11:30:00', 'DOCTOR'),
('58f1a9b4-82ce-445d-8c77-401a307d0857', 'dr.doquangh', 'dr.doquangh@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 07:45:00', 'DOCTOR'),
('e9c36fc2-6fce-4294-8213-6f83e96380f8', 'dr.tranquangi', 'dr.tranquangi@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-18 15:20:00', 'DOCTOR'),
('57557882-c134-49f7-837e-cebd3ef950f5', 'dr.vothanhj', 'dr.vothanhj@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:00:00', 'DOCTOR')
ON CONFLICT (email) DO NOTHING;

-- RECEPTIONIST Accounts (5 receptionists)
INSERT INTO accounts (account_id, username, email, password_hash, status, email_verified, phone_verified, last_login_at, role) VALUES
('e87bf6f2-d578-4e5c-afda-9ca74dd54abb', 'recep.levan', 'recep.levan@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:00:00', 'RECEPTIONIST'),
('87a4ce64-346c-44c6-8aff-d7f2f87c1dfe', 'recep.nguyenthik', 'recep.nguyenthik@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 17:30:00', 'RECEPTIONIST'),
('1c7d3569-7d7a-4da5-b343-bef19a17bb4d', 'recep.tranthil', 'recep.tranthil@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:15:00', 'RECEPTIONIST'),
('50d83bbd-275e-4154-ac65-6a0a504bcdb0', 'recep.phamvanm', 'recep.phamvanm@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-20 16:45:00', 'RECEPTIONIST'),
('53aeaf0f-f3b6-4493-ae3e-2d2a131f9d05', 'recep.hoangthin', 'recep.hoangthin@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-19 14:00:00', 'RECEPTIONIST')
ON CONFLICT (email) DO NOTHING;

-- NURSE Accounts (2 nurses)
INSERT INTO accounts (account_id, username, email, password_hash, status, email_verified, phone_verified, last_login_at, role) VALUES
('a3f5c8d2-1b4e-4a6f-9c3d-7e8f9a0b1c2d', 'nurse.dothih', 'nurse.dothih@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:10:00', 'NURSE'),
('b4e6d9c3-2c5f-4b7a-8d4e-9f0a1b2c3d4e', 'nurse.vuvann', 'nurse.vuvann@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 09:40:00', 'NURSE')
ON CONFLICT (email) DO NOTHING;

-- PATIENT Accounts (85 patients)
INSERT INTO accounts (account_id, username, email, password_hash, status, email_verified, phone_verified, created_at, role) VALUES
('00e1cbd4-6862-4ebe-9cac-9c17b6a20ed4', 'pt001', 'nguyenvana.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-06-15 10:30:00', 'PATIENT'),
('c81c963c-80a4-4f6d-8738-615e076c5c05', 'pt002', 'tranthib.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-06-16 14:20:00', 'PATIENT'),
('fd2effb8-ed52-40a4-bb22-c82475918aae', 'pt003', 'levanc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-01 09:15:00', 'PATIENT'),
('f9c58efa-0b33-40ad-b034-b88c6013d25d', 'pt004', 'phamthid.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-05 11:45:00', 'PATIENT'),
('9d27034d-8445-4459-a6c3-f191c9546e6b', 'pt005', 'hoangvane.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-10 16:00:00', 'PATIENT'),
('364c8a87-5c44-4b95-8617-2d01773ff2e3', 'pt006', 'dongthif.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-12 08:30:00', 'PATIENT'),
('20514b0d-0898-49e8-8832-edce947133d2', 'pt007', 'buihuug.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-18 13:20:00', 'PATIENT'),
('a191faec-6be1-43c1-9452-1590e4d2bb81', 'pt008', 'dangvnh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-22 10:00:00', 'PATIENT'),
('1dfe6dd7-2578-4c7b-9bfa-a8630ec7b5b7', 'pt009', 'duongthj.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-08-01 15:45:00', 'PATIENT'),
('4fa61ae3-64a5-4d07-b478-adc74c5a8268', 'pt010', 'tranvanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-08-05 09:30:00', 'PATIENT'),
('a960830b-a26b-4552-867e-5335076cffc9', 'pt011', 'vothik.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-08-10 14:15:00', 'PATIENT'),
('1cb53dd7-af84-4be0-9dba-85ac8e2284e3', 'pt012', 'cothil.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-08-15 11:00:00', 'PATIENT'),
('ef657d8a-3ffb-4988-adae-11d1ad866db5', 'pt013', 'thanhm.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-08-20 16:30:00', 'PATIENT'),
('26aaeb1f-efd8-427b-82b0-b343bee7c7cf', 'pt014', 'ngthanhvn.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-09-01 08:45:00', 'PATIENT'),
('1e55b494-a921-4fff-b223-eb8840f22476', 'pt015', 'lthikg.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-09-05 13:00:00', 'PATIENT'),
('13594230-002c-46d3-91b7-a22bbc0393b1', 'pt016', 'tranhuup.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-09-10 10:20:00', 'PATIENT'),
('d376531a-0c27-467f-ad77-a95378ee38cc', 'pt017', 'phanthir.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-09-15 15:30:00', 'PATIENT'),
('035b4e35-4d4a-4f76-8b87-9bb6d8bc7171', 'pt018', 'levans.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-09-20 09:00:00', 'PATIENT'),
('374599b9-bfe8-49f1-a9f0-37ea5794e876', 'pt019', 'ngvietq.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-10-01 14:45:00', 'PATIENT'),
('27a01e0c-2b80-434c-8723-7766bda0db89', 'pt020', 'chuongt.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-10-05 11:15:00', 'PATIENT'),
('58a368c9-2009-46a6-92f8-f14168cab2bf', 'pt021', 'hongthiu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-10-10 16:00:00', 'PATIENT'),
('69478c24-4b6b-4b4b-b67c-134407fbc02f', 'pt022', 'ngminhw.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-10-15 08:30:00', 'PATIENT'),
('6752b19b-992b-40a1-95e4-37149ab16375', 'pt023', 'bathanhx.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-10-20 13:45:00', 'PATIENT'),
('eea85b6f-64d0-4364-9be8-5d331cd0ae52', 'pt024', 'ductuanm.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-11-01 10:00:00', 'PATIENT'),
('b41262a8-f0e6-4ed3-b80c-4e01d831d101', 'pt025', 'thanhhuy.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-11-05 15:20:00', 'PATIENT'),
('2194e321-afb5-47e2-8440-ec88f24cfc99', 'pt026', 'thanhhai.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-11-10 09:45:00', 'PATIENT'),
('74e8ea90-d60c-4cd2-a68c-2898897a5bc6', 'pt027', 'hongngoc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-11-15 14:00:00', 'PATIENT'),
('7613d405-d7d6-40b2-83c0-5c8d41ea8553', 'pt028', 'quoctrinh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-11-20 11:30:00', 'PATIENT'),
('cb1e528c-fa6c-41ff-aefe-e5793475af53', 'pt029', 'vietanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-12-01 16:15:00', 'PATIENT'),
('7c2c71d0-88c1-4eb1-909f-ab5425206825', 'pt030', 'minhtuong.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-12-05 08:00:00', 'PATIENT'),
('07e35dcd-c091-40eb-88e3-afa4a56becde', 'pt031', 'thanhloc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-12-10 13:30:00', 'PATIENT'),
('716a917e-adc7-4d18-9392-0c14f7a99288', 'pt032', 'truonggiang.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-12-15 10:45:00', 'PATIENT'),
('57c8b24b-35ce-48e2-bdcb-2499b4a2901b', 'pt033', 'ngoclinh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-12-20 15:00:00', 'PATIENT'),
('b0604009-bb1f-427c-9849-2cb8a0814d06', 'pt034', 'phuongthao.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-01-05 09:20:00', 'PATIENT'),
('bee663d5-828d-4d9c-be81-5a5b14c07454', 'pt035', 'nguyenhoang.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-01-10 14:00:00', 'PATIENT'),
('ce2604d4-20c0-4a53-8549-ce08b521dcd5', 'pt036', 'hathanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-01-15 11:30:00', 'PATIENT'),
('f3158977-ba56-453a-855c-20c51aaccf1f', 'pt037', 'trankim.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-01-20 16:45:00', 'PATIENT'),
('8a87f5ed-b5c4-472a-95a5-a1a65aba105b', 'pt038', 'dohuy.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-01-25 08:15:00', 'PATIENT'),
('3b6a9539-a148-4b59-9069-2be8214c9513', 'pt039', 'nguyenduc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-01 13:00:00', 'PATIENT'),
('344e348d-e233-43d3-a478-15710bd397eb', 'pt040', 'luongvan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-05 10:30:00', 'PATIENT'),
('b5e6b7c8-7903-48ee-b326-5a3592e2df17', 'pt041', 'caovan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-10 15:45:00', 'PATIENT'),
('a366ab82-64d1-4461-bd5a-37e0fad7b005', 'pt042', 'nhutminh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-15 09:00:00', 'PATIENT'),
('2ad39f94-996b-4f08-b15d-a492174265e2', 'pt043', 'tranquang.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-20 14:20:00', 'PATIENT'),
('8799121e-d163-4b8b-b27b-201ddd132342', 'pt044', 'nguyenhue.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-25 11:00:00', 'PATIENT'),
('6230d895-73d6-4cce-801a-20d35246975c', 'pt045', 'lehue.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-01 16:30:00', 'PATIENT'),
('a2a40b8d-7790-4991-b772-319566cc67e1', 'pt046', 'phamhung.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-05 08:45:00', 'PATIENT'),
('48185c91-01d0-4ccc-9836-71645724ee3a', 'pt047', 'hothanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-10 13:15:00', 'PATIENT'),
('e281f03d-154c-45cf-a980-5c9d91f0008f', 'pt048', 'luuminh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-15 10:00:00', 'PATIENT'),
('f3d842ce-cbec-4c4a-a977-b692308adab0', 'pt049', 'trieuvan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-18 15:30:00', 'PATIENT'),
('31847ae3-442c-48ef-ad94-f24528a9c9b5', 'pt050', 'khacnhuanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-20 09:45:00', 'PATIENT'),
('8f604e8e-aa8c-4ac1-9a18-c872a9389941', 'pt051', 'tranduy.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 14:00:00', 'PATIENT'),
('e2eda81c-d7fe-45e1-8f3d-e2fc0b5c9b76', 'pt052', 'nguyenbao.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 11:15:00', 'PATIENT'),
('a1f22b12-edb6-4bd0-8f7a-748fab705c14', 'pt053', 'leducluan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 16:45:00', 'PATIENT'),
('59c74179-1f65-46d5-b147-2c4eb65b8048', 'pt054', 'hoangthanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 08:30:00', 'PATIENT'),
('311e062b-f20d-4129-95f9-288e404a0da3', 'pt055', 'tranthanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 13:00:00', 'PATIENT'),
('b48f58a8-7b47-4040-84c5-487cd89e94cf', 'pt056', 'dinhhuy.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 10:30:00', 'PATIENT'),
('063326f1-fca2-4d9c-963e-e463278e1910', 'pt057', 'thaotrinh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 15:15:00', 'PATIENT'),
('60c000f4-4c39-4ad7-acde-a7e4c15d8a4a', 'pt058', 'vuviet.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:00:00', 'PATIENT'),
('26d6b123-7d1b-4cca-95cc-0d58234cc666', 'pt059', 'dangquang.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 14:45:00', 'PATIENT'),
('0332fe32-a77a-48f9-885a-61921822487f', 'pt060', 'nguyenviet.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 11:30:00', 'PATIENT'),
('b007710e-640a-482b-9bac-896caf25346c', 'pt061', 'phamquoc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 16:00:00', 'PATIENT'),
('1ea1fa23-394e-4cbb-ab32-45a7b0b59797', 'pt062', 'buiquan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:15:00', 'PATIENT'),
('69987294-46f6-4a2b-b228-0916177d8a23', 'pt063', 'nguyenxuan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 13:45:00', 'PATIENT'),
('318cb504-2283-424b-8922-e578675f060d', 'pt064', 'lehong.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 10:15:00', 'PATIENT'),
('96ce6cac-4cd0-4fa1-a527-67532e4f93f5', 'pt065', 'tranhuu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 15:30:00', 'PATIENT'),
('ba2fafc6-4b21-474a-b938-9c6f583dcb7e', 'pt066', 'dangthu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:30:00', 'PATIENT'),
('d7af2ff6-8f96-402e-b3d1-dc0168646ab0', 'pt067', 'nguyenhoa.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 14:15:00', 'PATIENT'),
('17afd4c5-f617-4d1d-9add-7437787f4406', 'pt068', 'luongphu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 11:00:00', 'PATIENT'),
('b6d6bedd-3f6a-4793-b093-ad8a705049ac', 'pt069', 'hoanglong.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 16:30:00', 'PATIENT'),
('f71e4234-43ec-4e58-b1f6-884a0451e1b4', 'pt070', 'nguyentan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:45:00', 'PATIENT'),
('84ff62c4-8c9f-4bed-9f2a-88dfdf22ab18', 'pt071', 'chucong.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 13:30:00', 'PATIENT'),
('c08e5a19-158d-47e6-af6c-daf26b476f97', 'pt072', 'leviet.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 10:00:00', 'PATIENT'),
('bd22b481-f060-4438-82f2-10c089c23a82', 'pt073', 'phamngoc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 15:45:00', 'PATIENT'),
('7c070fbb-a57d-438e-9767-ae18f73632c3', 'pt074', 'nguyenlam.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:15:00', 'PATIENT'),
('8e8ca1d2-453d-4665-b2fb-e9e477dfd556', 'pt075', 'tranlam.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 14:00:00', 'PATIENT'),
('7fb8eaef-92f3-4e06-b7b4-930295908819', 'pt076', 'buihoang.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 11:30:00', 'PATIENT'),
('bc79d5ae-39d0-4a42-9d13-923be87ca7da', 'pt077', 'lehuu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 16:15:00', 'PATIENT'),
('1c801831-c576-4fbe-923a-628dd58f01ae', 'pt078', 'vuvan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:00:00', 'PATIENT'),
('19711d52-bdcb-4c2b-919f-8c6ce0f8845b', 'pt079', 'dangthi.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 13:45:00', 'PATIENT'),
('3d033896-71e3-4cd8-8677-5fa2b8f376ae', 'pt080', 'nguyenvu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 10:30:00', 'PATIENT'),
('3cdbe831-5fdc-4137-b6b6-286b7e6e192f', 'pt081', 'tranvan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 15:00:00', 'PATIENT'),
('04e12d56-02ff-48c4-8c22-e1af10376445', 'pt082', 'phamvan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:45:00', 'PATIENT'),
('df46f5cb-5c2a-475c-9aa2-c8b78a27db59', 'pt083', 'hoangvu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 14:30:00', 'PATIENT'),
('62931391-47cf-496d-886e-796f08e2ffe1', 'pt084', 'banguyen.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 11:15:00', 'PATIENT'),
('806c061b-3e1b-471f-bb30-b3b7596766d9', 'pt085', 'dinhphu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 16:45:00', 'PATIENT')
ON CONFLICT (email) DO NOTHING;
