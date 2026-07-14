-- ============================================
-- SAMPLE DATA FOR AUTH SERVICE
-- Realistic Vietnamese data with ~100 accounts
-- ============================================

-- Password: "Password123!" for all accounts
-- BCrypt hash: $2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6

-- ADMIN Account
INSERT INTO accounts (account_id, username, email, password_hash, status, email_verified, phone_verified, last_login_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:30:00')
ON CONFLICT (email) DO NOTHING;

-- DOCTOR Accounts (10 doctors)
INSERT INTO accounts (account_id, username, email, password_hash, status, email_verified, phone_verified, last_login_at) VALUES 
('d0000001-0001-0001-0001-000000000001', 'dr.nguyenvana', 'dr.nguyenvana@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:15:00'),
('d0000001-0001-0001-0001-000000000002', 'dr.tranthib', 'dr.tranthib@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 17:45:00'),
('d0000001-0001-0001-0001-000000000003', 'dr.levanc', 'dr.levanc@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 10:00:00'),
('d0000001-0001-0001-0001-000000000004', 'dr.phamthid', 'dr.phamthid@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-20 14:30:00'),
('d0000001-0001-0001-0001-000000000005', 'dr.hoangvane', 'dr.hoangvane@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:00:00'),
('d0000001-0001-0001-0001-000000000006', 'dr.nguyenthif', 'dr.nguyenthif@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-19 16:00:00'),
('d0000001-0001-0001-0001-000000000007', 'dr.buihuug', 'dr.buihuug@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 11:30:00'),
('d0000001-0001-0001-0001-000000000008', 'dr.doquangh', 'dr.doquangh@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 07:45:00'),
('d0000001-0001-0001-0001-000000000009', 'dr.tranquangi', 'dr.tranquangi@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-18 15:20:00'),
('d0000001-0001-0001-0001-000000000010', 'dr.vothanhj', 'dr.vothanhj@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:00:00')
ON CONFLICT (email) DO NOTHING;

-- RECEPTIONIST Accounts (5 receptionists)
INSERT INTO accounts (account_id, username, email, password_hash, status, email_verified, phone_verified, last_login_at) VALUES 
('r0000001-0001-0001-0001-000000000001', 'recep.levan', 'recep.levan@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:00:00'),
('r0000001-0001-0001-0001-000000000002', 'recep.nguyenthik', 'recep.nguyenthik@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 17:30:00'),
('r0000001-0001-0001-0001-000000000003', 'recep.tranthil', 'recep.tranthil@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:15:00'),
('r0000001-0001-0001-0001-000000000004', 'recep.phamvanm', 'recep.phamvanm@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-20 16:45:00'),
('r0000001-0001-0001-0001-000000000005', 'recep.hoangthin', 'recep.hoangthin@smile.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-19 14:00:00')
ON CONFLICT (email) DO NOTHING;

-- PATIENT Accounts (85 patients)
INSERT INTO accounts (account_id, username, email, password_hash, status, email_verified, phone_verified, created_at) VALUES 
('p0000001-0001-0001-0001-000000000001', 'pt001', 'nguyenvana.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-06-15 10:30:00'),
('p0000001-0001-0001-0001-000000000002', 'pt002', 'tranthib.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-06-16 14:20:00'),
('p0000001-0001-0001-0001-000000000003', 'pt003', 'levanc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-01 09:15:00'),
('p0000001-0001-0001-0001-000000000004', 'pt004', 'phamthid.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-05 11:45:00'),
('p0000001-0001-0001-0001-000000000005', 'pt005', 'hoangvane.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-10 16:00:00'),
('p0000001-0001-0001-0001-000000000006', 'pt006', 'dongthif.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-12 08:30:00'),
('p0000001-0001-0001-0001-000000000007', 'pt007', 'buihuug.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-18 13:20:00'),
('p0000001-0001-0001-0001-000000000008', 'pt008', 'dangvnh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-07-22 10:00:00'),
('p0000001-0001-0001-0001-000000000009', 'pt009', 'duongthj.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-08-01 15:45:00'),
('p0000001-0001-0001-0001-000000000010', 'pt010', 'tranvanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-08-05 09:30:00'),
('p0000001-0001-0001-0001-000000000011', 'pt011', 'vothik.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-08-10 14:15:00'),
('p0000001-0001-0001-0001-000000000012', 'pt012', 'cothil.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-08-15 11:00:00'),
('p0000001-0001-0001-0001-000000000013', 'pt013', 'thanhm.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-08-20 16:30:00'),
('p0000001-0001-0001-0001-000000000014', 'pt014', 'ngthanhvn.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-09-01 08:45:00'),
('p0000001-0001-0001-0001-000000000015', 'pt015', 'lthikg.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-09-05 13:00:00'),
('p0000001-0001-0001-0001-000000000016', 'pt016', 'tranhuup.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-09-10 10:20:00'),
('p0000001-0001-0001-0001-000000000017', 'pt017', 'phanthir.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-09-15 15:30:00'),
('p0000001-0001-0001-0001-000000000018', 'pt018', 'levans.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-09-20 09:00:00'),
('p0000001-0001-0001-0001-000000000019', 'pt019', 'ngvietq.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-10-01 14:45:00'),
('p0000001-0001-0001-0001-000000000020', 'pt020', 'chuongt.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-10-05 11:15:00'),
('p0000001-0001-0001-0001-000000000021', 'pt021', 'hongthiu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-10-10 16:00:00'),
('p0000001-0001-0001-0001-000000000022', 'pt022', 'ngminhw.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-10-15 08:30:00'),
('p0000001-0001-0001-0001-000000000023', 'pt023', 'bathanhx.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-10-20 13:45:00'),
('p0000001-0001-0001-0001-000000000024', 'pt024', 'ductuanm.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-11-01 10:00:00'),
('p0000001-0001-0001-0001-000000000025', 'pt025', 'thanhhuy.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-11-05 15:20:00'),
('p0000001-0001-0001-0001-000000000026', 'pt026', 'thanhhai.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-11-10 09:45:00'),
('p0000001-0001-0001-0001-000000000027', 'pt027', 'hongngoc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-11-15 14:00:00'),
('p0000001-0001-0001-0001-000000000028', 'pt028', 'quoctrinh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-11-20 11:30:00'),
('p0000001-0001-0001-0001-000000000029', 'pt029', 'vietanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-12-01 16:15:00'),
('p0000001-0001-0001-0001-000000000030', 'pt030', 'minhtuong.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-12-05 08:00:00'),
('p0000001-0001-0001-0001-000000000031', 'pt031', 'thanhloc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-12-10 13:30:00'),
('p0000001-0001-0001-0001-000000000032', 'pt032', 'truonggiang.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-12-15 10:45:00'),
('p0000001-0001-0001-0001-000000000033', 'pt033', 'ngoclinh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2025-12-20 15:00:00'),
('p0000001-0001-0001-0001-000000000034', 'pt034', 'phuongthao.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-01-05 09:20:00'),
('p0000001-0001-0001-0001-000000000035', 'pt035', 'nguyenhoang.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-01-10 14:00:00'),
('p0000001-0001-0001-0001-000000000036', 'pt036', 'hathanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-01-15 11:30:00'),
('p0000001-0001-0001-0001-000000000037', 'pt037', 'trankim.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-01-20 16:45:00'),
('p0000001-0001-0001-0001-000000000038', 'pt038', 'dohuy.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-01-25 08:15:00'),
('p0000001-0001-0001-0001-000000000039', 'pt039', 'nguyenduc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-01 13:00:00'),
('p0000001-0001-0001-0001-000000000040', 'pt040', 'luongvan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-05 10:30:00'),
('p0000001-0001-0001-0001-000000000041', 'pt041', 'caovan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-10 15:45:00'),
('p0000001-0001-0001-0001-000000000042', 'pt042', 'nhutminh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-15 09:00:00'),
('p0000001-0001-0001-0001-000000000043', 'pt043', 'tranquang.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-20 14:20:00'),
('p0000001-0001-0001-0001-000000000044', 'pt044', 'nguyenhue.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-02-25 11:00:00'),
('p0000001-0001-0001-0001-000000000045', 'pt045', 'lehue.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-01 16:30:00'),
('p0000001-0001-0001-0001-000000000046', 'pt046', 'phamhung.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-05 08:45:00'),
('p0000001-0001-0001-0001-000000000047', 'pt047', 'hothanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-10 13:15:00'),
('p0000001-0001-0001-0001-000000000048', 'pt048', 'luuminh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-15 10:00:00'),
('p0000001-0001-0001-0001-000000000049', 'pt049', 'trieuvan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-18 15:30:00'),
('p0000001-0001-0001-0001-000000000050', 'pt050', 'khacnhuanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-20 09:45:00'),
('p0000001-0001-0001-0001-000000000051', 'pt051', 'tranduy.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 14:00:00'),
('p0000001-0001-0001-0001-000000000052', 'pt052', 'nguyenbao.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 11:15:00'),
('p0000001-0001-0001-0001-000000000053', 'pt053', 'leducluan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 16:45:00'),
('p0000001-0001-0001-0001-000000000054', 'pt054', 'hoangthanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-21 08:30:00'),
('p0000001-0001-0001-0001-000000000055', 'pt055', 'tranthanh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 13:00:00'),
('p0000001-0001-0001-0001-000000000056', 'pt056', 'dinhhuy.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 10:30:00'),
('p0000001-0001-0001-0001-000000000057', 'pt057', 'thaotrinh.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 15:15:00'),
('p0000001-0001-0001-0001-000000000058', 'pt058', 'vuviet.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:00:00'),
('p0000001-0001-0001-0001-000000000059', 'pt059', 'dangquang.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 14:45:00'),
('p0000001-0001-0001-0001-000000000060', 'pt060', 'nguyenviet.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 11:30:00'),
('p0000001-0001-0001-0001-000000000061', 'pt061', 'phamquoc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 16:00:00'),
('p0000001-0001-0001-0001-000000000062', 'pt062', 'buiquan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:15:00'),
('p0000001-0001-0001-0001-000000000063', 'pt063', 'nguyenxuan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 13:45:00'),
('p0000001-0001-0001-0001-000000000064', 'pt064', 'lehong.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 10:15:00'),
('p0000001-0001-0001-0001-000000000065', 'pt065', 'tranhuu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 15:30:00'),
('p0000001-0001-0001-0001-000000000066', 'pt066', 'dangthu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:30:00'),
('p0000001-0001-0001-0001-000000000067', 'pt067', 'nguyenhoa.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 14:15:00'),
('p0000001-0001-0001-0001-000000000068', 'pt068', 'luongphu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 11:00:00'),
('p0000001-0001-0001-0001-000000000069', 'pt069', 'hoanglong.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 16:30:00'),
('p0000001-0001-0001-0001-000000000070', 'pt070', 'nguyentan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:45:00'),
('p0000001-0001-0001-0001-000000000071', 'pt071', 'chucong.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 13:30:00'),
('p0000001-0001-0001-0001-000000000072', 'pt072', 'leviet.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 10:00:00'),
('p0000001-0001-0001-0001-000000000073', 'pt073', 'phamngoc.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 15:45:00'),
('p0000001-0001-0001-0001-000000000074', 'pt074', 'nguyenlam.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:15:00'),
('p0000001-0001-0001-0001-000000000075', 'pt075', 'tranlam.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 14:00:00'),
('p0000001-0001-0001-0001-000000000076', 'pt076', 'buihoang.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 11:30:00'),
('p0000001-0001-0001-0001-000000000077', 'pt077', 'lehuu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 16:15:00'),
('p0000001-0001-0001-0001-000000000078', 'pt078', 'vuvan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 08:00:00'),
('p0000001-0001-0001-0001-000000000079', 'pt079', 'dangthi.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 13:45:00'),
('p0000001-0001-0001-0001-000000000080', 'pt080', 'nguyenvu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 10:30:00'),
('p0000001-0001-0001-0001-000000000081', 'pt081', 'tranvan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 15:00:00'),
('p0000001-0001-0001-0001-000000000082', 'pt082', 'phamvan.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 09:45:00'),
('p0000001-0001-0001-0001-000000000083', 'pt083', 'hoangvu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 14:30:00'),
('p0000001-0001-0001-0001-000000000084', 'pt084', 'banguyen.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 11:15:00'),
('p0000001-0001-0001-0001-000000000085', 'pt085', 'dinhphu.pt@email.com', '$2a$12$/9i.FgJJF4sABDN1fi/TOuxNBGB5JyHCWvM2GfFjwSayXX34znAn6', 'ACTIVE', true, true, '2026-03-22 16:45:00')
ON CONFLICT (email) DO NOTHING;