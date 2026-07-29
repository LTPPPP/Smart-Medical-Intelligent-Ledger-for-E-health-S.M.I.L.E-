-- ============================================
-- SAMPLE DATA FOR USER SERVICE
-- Realistic Vietnamese data with ~100 users
-- Note: user_id must match account_id in auth_service_db.accounts
-- ============================================

-- Roles (role_name matches backend RoleEnum: UPPERCASE, all 6 roles)
INSERT INTO roles (role_id, role_name, description) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ADMIN', 'System Administrator with full access'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'DOCTOR', 'Medical Doctor with patient management access'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'RECEPTIONIST', 'Front desk staff with appointment management access'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'PATIENT', 'Regular patient with limited access'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'NURSE', 'Clinical support nurse'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'MANAGER', 'Clinic manager with operational oversight')
ON CONFLICT (role_id) DO NOTHING;

-- Permissions
INSERT INTO permissions (permission_name, resource, action, description) VALUES 
('user.create', 'user', 'create', 'Create new users'),
('user.read', 'user', 'read', 'View user information'),
('user.update', 'user', 'update', 'Update user information'),
('user.delete', 'user', 'delete', 'Delete users'),
('role.create', 'role', 'create', 'Create new roles'),
('role.read', 'role', 'read', 'View roles'),
('role.update', 'role', 'update', 'Update roles'),
('role.delete', 'role', 'delete', 'Delete roles'),
('signature.create', 'signature', 'create', 'Create digital signatures'),
('signature.read', 'signature', 'read', 'View digital signatures'),
('signature.update', 'signature', 'update', 'Update digital signatures'),
('signature.delete', 'signature', 'delete', 'Delete digital signatures'),
('log.read', 'log', 'read', 'View access logs'),
('log.statistics', 'log', 'statistics', 'View access log statistics'),
('appointment.create', 'appointment', 'create', 'Create appointments'),
('appointment.read', 'appointment', 'read', 'View appointments'),
('appointment.update', 'appointment', 'update', 'Update appointments'),
('appointment.cancel', 'appointment', 'cancel', 'Cancel appointments'),
('medical_record.create', 'medical_record', 'create', 'Create medical records'),
('medical_record.read', 'medical_record', 'read', 'View medical records'),
('medical_record.update', 'medical_record', 'update', 'Update medical records'),
('payment.create', 'payment', 'create', 'Create payments'),
('payment.read', 'payment', 'read', 'View payments'),
('clinic.manage', 'clinic', 'manage', 'Manage clinic settings')
ON CONFLICT (permission_name) DO NOTHING;

-- Assign All Permissions to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Assign Basic Permissions to Doctor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'DOCTOR' AND (
    p.permission_name LIKE 'user.read' OR
    p.permission_name LIKE 'medical_record.%' OR
    p.permission_name LIKE 'appointment.%' OR
    p.permission_name LIKE 'signature.%'
)
ON CONFLICT DO NOTHING;

-- Assign Basic Permissions to Receptionist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'RECEPTIONIST' AND (
    p.permission_name LIKE 'user.read' OR
    p.permission_name LIKE 'appointment.%' OR
    p.permission_name LIKE 'payment.%'
)
ON CONFLICT DO NOTHING;

-- Assign Basic Permissions to Nurse (read-only clinical support)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'NURSE' AND (
    p.permission_name LIKE 'user.read' OR
    p.permission_name LIKE 'appointment.read' OR
    p.permission_name LIKE 'medical_record.read'
)
ON CONFLICT DO NOTHING;

-- Assign Permissions to Manager (clinic operations oversight)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'MANAGER' AND (
    p.permission_name LIKE 'user.%' OR
    p.permission_name LIKE 'appointment.%' OR
    p.permission_name LIKE 'payment.%' OR
    p.permission_name LIKE 'clinic.%' OR
    p.permission_name LIKE 'log.%'
)
ON CONFLICT DO NOTHING;

-- User Profiles - Admin
INSERT INTO users (user_id, full_name, email, phone, date_of_birth, gender, avatar_url, created_by) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Nguyễn Văn Quản Lý', 'admin@smile.com', '+84111111111', '1975-03-15', 1, 'https://storage.smile.com/avatars/admin001.jpg', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (user_id) DO NOTHING;

-- User Profiles - Doctors (10)
INSERT INTO users (user_id, full_name, email, phone, date_of_birth, gender, avatar_url, created_by) VALUES 
('c8be5977-44f1-4f1c-ad46-58479cd52d37', 'BS. Nguyễn Văn A', 'dr.nguyenvana@smile.com', '+84900000001', '1980-05-15', 1, 'https://randomuser.me/api/portraits/men/32.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('c90773ba-3bed-4879-b1fa-d39ca9eee127', 'BS. Trần Thị B', 'dr.tranthib@smile.com', '+84900000002', '1985-03-22', 2, 'https://randomuser.me/api/portraits/women/44.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('788965d4-e3e3-451d-bdcb-2577eb6d17fc', 'BS. Lê Văn C', 'dr.levanc@smile.com', '+84900000003', '1978-08-10', 1, 'https://randomuser.me/api/portraits/men/45.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('a1263dc8-5bc9-451a-95dd-242ef757efe4', 'BS. Phạm Thị D', 'dr.phamthid@smile.com', '+84900000004', '1982-11-25', 2, 'https://randomuser.me/api/portraits/women/68.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('9d2bf998-10b6-435b-9950-c16682a4fbd1', 'BS. Hoàng Văn E', 'dr.hoangvane@smile.com', '+84900000005', '1975-07-08', 1, 'https://randomuser.me/api/portraits/men/51.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('61e1c766-cd7b-4978-b635-2999615f4f4a', 'BS. Nguyễn Thị F', 'dr.nguyenthif@smile.com', '+84900000006', '1988-01-20', 2, 'https://randomuser.me/api/portraits/women/23.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('ab014405-2237-4646-a20c-af5049173dc2', 'BS. Bùi Hữu G', 'dr.buihuug@smile.com', '+84900000007', '1983-09-05', 1, 'https://randomuser.me/api/portraits/men/62.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('58f1a9b4-82ce-445d-8c77-401a307d0857', 'BS. Đỗ Quang H', 'dr.doquangh@smile.com', '+84900000008', '1979-04-18', 1, 'https://randomuser.me/api/portraits/men/71.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('e9c36fc2-6fce-4294-8213-6f83e96380f8', 'BS. Trần Quang I', 'dr.tranquangi@smile.com', '+84900000009', '1986-12-30', 1, 'https://randomuser.me/api/portraits/men/12.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('57557882-c134-49f7-837e-cebd3ef950f5', 'BS. Võ Thanh J', 'dr.vothanhj@smile.com', '+84900000010', '1981-06-22', 1, 'https://randomuser.me/api/portraits/men/88.jpg', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (user_id) DO NOTHING;

-- User Profiles - Receptionists (5)
INSERT INTO users (user_id, full_name, email, phone, date_of_birth, gender, avatar_url, created_by) VALUES 
('e87bf6f2-d578-4e5c-afda-9ca74dd54abb', 'Lê Văn Tiếp Nhận', 'recep.levan@smile.com', '+84910000001', '1992-02-14', 1, 'https://storage.smile.com/avatars/recep001.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('87a4ce64-346c-44c6-8aff-d7f2f87c1dfe', 'Nguyễn Thị K', 'recep.nguyenthik@smile.com', '+84910000002', '1995-05-20', 2, 'https://storage.smile.com/avatars/recep002.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('1c7d3569-7d7a-4da5-b343-bef19a17bb4d', 'Trần Thị L', 'recep.tranthil@smile.com', '+84910000003', '1993-08-08', 2, 'https://storage.smile.com/avatars/recep003.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('50d83bbd-275e-4154-ac65-6a0a504bcdb0', 'Phạm Văn M', 'recep.phamvanm@smile.com', '+84910000004', '1990-11-12', 1, 'https://storage.smile.com/avatars/recep004.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('53aeaf0f-f3b6-4493-ae3e-2d2a131f9d05', 'Hoàng Thị N', 'recep.hoangthin@smile.com', '+84910000005', '1994-03-25', 2, 'https://storage.smile.com/avatars/recep005.jpg', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (user_id) DO NOTHING;

-- User Profiles - Patients (85)
INSERT INTO users (user_id, full_name, email, phone, date_of_birth, gender, created_by) VALUES 
('00e1cbd4-6862-4ebe-9cac-9c17b6a20ed4', 'Nguyễn Văn An', 'nguyenvana.pt@email.com', '+84910000011', '1995-06-15', 1, '550e8400-e29b-41d4-a716-446655440000'),
('c81c963c-80a4-4f6d-8738-615e076c5c05', 'Trần Thị Bình', 'tranthib.pt@email.com', '+84910000012', '1992-07-20', 2, '550e8400-e29b-41d4-a716-446655440000'),
('fd2effb8-ed52-40a4-bb22-c82475918aae', 'Lê Văn Cường', 'levanc.pt@email.com', '+84910000013', '1988-03-10', 1, '550e8400-e29b-41d4-a716-446655440000'),
('f9c58efa-0b33-40ad-b034-b88c6013d25d', 'Phạm Thị Duyên', 'phamthid.pt@email.com', '+84910000014', '1990-09-25', 2, '550e8400-e29b-41d4-a716-446655440000'),
('9d27034d-8445-4459-a6c3-f191c9546e6b', 'Hoàng Văn Em', 'hoangvane.pt@email.com', '+84910000015', '1985-12-08', 1, '550e8400-e29b-41d4-a716-446655440000'),
('364c8a87-5c44-4b95-8617-2d01773ff2e3', 'Đỗ Thị Phương', 'dongthif.pt@email.com', '+84910000016', '1993-04-18', 2, '550e8400-e29b-41d4-a716-446655440000'),
('20514b0d-0898-49e8-8832-edce947133d2', 'Bùi Hữu Gia', 'buihuug.pt@email.com', '+84910000017', '1991-08-22', 1, '550e8400-e29b-41d4-a716-446655440000'),
('a191faec-6be1-43c1-9452-1590e4d2bb81', 'Đặng Văn Hùng', 'dangvnh.pt@email.com', '+84910000018', '1987-01-30', 1, '550e8400-e29b-41d4-a716-446655440000'),
('1dfe6dd7-2578-4c7b-9bfa-a8630ec7b5b7', 'Dương Thị Hương', 'duongthj.pt@email.com', '+84910000019', '1994-06-12', 2, '550e8400-e29b-41d4-a716-446655440000'),
('4fa61ae3-64a5-4d07-b478-adc74c5a8268', 'Trần Văn Khoa', 'tranvanh.pt@email.com', '+84910000020', '1996-10-05', 1, '550e8400-e29b-41d4-a716-446655440000'),
('a960830b-a26b-4552-867e-5335076cffc9', 'Võ Thị Lan', 'vothik.pt@email.com', '+84910000021', '1989-02-28', 2, '550e8400-e29b-41d4-a716-446655440000'),
('1cb53dd7-af84-4be0-9dba-85ac8e2284e3', 'Cô Thị Linh', 'cothil.pt@email.com', '+84910000022', '1997-05-14', 2, '550e8400-e29b-41d4-a716-446655440000'),
('ef657d8a-3ffb-4988-adae-11d1ad866db5', 'Thành Minh', 'thanhm.pt@email.com', '+84910000023', '1992-11-03', 1, '550e8400-e29b-41d4-a716-446655440000'),
('26aaeb1f-efd8-427b-82b0-b343bee7c7cf', 'Nguyễn Thanh Vân', 'ngthanhvn.pt@email.com', '+84910000024', '1991-07-19', 2, '550e8400-e29b-41d4-a716-446655440000'),
('1e55b494-a921-4fff-b223-eb8840f22476', 'Lê Thị Kim', 'lthikg.pt@email.com', '+84910000025', '1994-09-08', 2, '550e8400-e29b-41d4-a716-446655440000'),
('13594230-002c-46d3-91b7-a22bbc0393b1', 'Trần Hữu Phúc', 'tranhuup.pt@email.com', '+84910000026', '1993-03-27', 1, '550e8400-e29b-41d4-a716-446655440000'),
('d376531a-0c27-467f-ad77-a95378ee38cc', 'Phan Thị Thu', 'phanthir.pt@email.com', '+84910000027', '1990-12-15', 2, '550e8400-e29b-41d4-a716-446655440000'),
('035b4e35-4d4a-4f76-8b87-9bb6d8bc7171', 'Lê Văn Sơn', 'levans.pt@email.com', '+84910000028', '1988-06-22', 1, '550e8400-e29b-41d4-a716-446655440000'),
('374599b9-bfe8-49f1-a9f0-37ea5794e876', 'Nguyễn Việt Quang', 'ngvietq.pt@email.com', '+84910000029', '1995-08-11', 1, '550e8400-e29b-41d4-a716-446655440000'),
('27a01e0c-2b80-434c-8723-7766bda0db89', 'Chu Văn Tài', 'chuongt.pt@email.com', '+84910000030', '1992-01-05', 1, '550e8400-e29b-41d4-a716-446655440000'),
('58a368c9-2009-46a6-92f8-f14168cab2bf', 'Hồ Thị Thanh', 'hongthiu.pt@email.com', '+84910000031', '1991-04-18', 2, '550e8400-e29b-41d4-a716-446655440000'),
('69478c24-4b6b-4b4b-b67c-134407fbc02f', 'Nguyễn Minh Tuấn', 'ngminhw.pt@email.com', '+84910000032', '1994-10-30', 1, '550e8400-e29b-41d4-a716-446655440000'),
('6752b19b-992b-40a1-95e4-37149ab16375', 'Ba Thanh Xuân', 'bathanhx.pt@email.com', '+84910000033', '1993-07-12', 2, '550e8400-e29b-41d4-a716-446655440000'),
('eea85b6f-64d0-4364-9be8-5d331cd0ae52', 'Đặng Huy', 'ductuanm.pt@email.com', '+84910000034', '1989-02-25', 1, '550e8400-e29b-41d4-a716-446655440000'),
('b41262a8-f0e6-4ed3-b80c-4e01d831d101', 'Trần Thanh Hùng', 'thanhhuy.pt@email.com', '+84910000035', '1990-05-08', 1, '550e8400-e29b-41d4-a716-446655440000'),
('2194e321-afb5-47e2-8440-ec88f24cfc99', 'Nguyễn Thanh Hải', 'thanhhai.pt@email.com', '+84910000036', '1996-11-22', 1, '550e8400-e29b-41d4-a716-446655440000'),
('74e8ea90-d60c-4cd2-a68c-2898897a5bc6', 'Hồng Ngọc', 'hongngoc.pt@email.com', '+84910000037', '1992-08-15', 2, '550e8400-e29b-41d4-a716-446655440000'),
('7613d405-d7d6-40b2-83c0-5c8d41ea8553', 'Quốc Trung', 'quoctrinh.pt@email.com', '+84910000038', '1991-03-03', 1, '550e8400-e29b-41d4-a716-446655440000'),
('cb1e528c-fa6c-41ff-aefe-e5793475af53', 'Việt Anh', 'vietanh.pt@email.com', '+84910000039', '1994-09-28', 1, '550e8400-e29b-41d4-a716-446655440000'),
('7c2c71d0-88c1-4eb1-909f-ab5425206825', 'Minh Tường', 'minhtuong.pt@email.com', '+84910000040', '1993-06-17', 1, '550e8400-e29b-41d4-a716-446655440000'),
('07e35dcd-c091-40eb-88e3-afa4a56becde', 'Thanh Lộc', 'thanhloc.pt@email.com', '+84910000041', '1987-12-01', 1, '550e8400-e29b-41d4-a716-446655440000'),
('716a917e-adc7-4d18-9392-0c14f7a99288', 'Trương Giang', 'truonggiang.pt@email.com', '+84910000042', '1995-04-23', 2, '550e8400-e29b-41d4-a716-446655440000'),
('57c8b24b-35ce-48e2-bdcb-2499b4a2901b', 'Ngọc Linh', 'ngoclinh.pt@email.com', '+84910000043', '1992-10-09', 2, '550e8400-e29b-41d4-a716-446655440000'),
('b0604009-bb1f-427c-9849-2cb8a0814d06', 'Phương Thảo', 'phuongthao.pt@email.com', '+84910000044', '1990-01-14', 2, '550e8400-e29b-41d4-a716-446655440000'),
('bee663d5-828d-4d9c-be81-5a5b14c07454', 'Nguyễn Hoàng', 'nguyenhoang.pt@email.com', '+84910000045', '1994-07-26', 1, '550e8400-e29b-41d4-a716-446655440000'),
('ce2604d4-20c0-4a53-8549-ce08b521dcd5', 'Hà Tấn Thành', 'hathanh.pt@email.com', '+84910000046', '1991-11-08', 1, '550e8400-e29b-41d4-a716-446655440000'),
('f3158977-ba56-453a-855c-20c51aaccf1f', 'Trần Kim Oanh', 'trankim.pt@email.com', '+84910000047', '1989-05-19', 2, '550e8400-e29b-41d4-a716-446655440000'),
('8a87f5ed-b5c4-472a-95a5-a1a65aba105b', 'Đỗ Huy', 'dohuy.pt@email.com', '+84910000048', '1993-08-31', 1, '550e8400-e29b-41d4-a716-446655440000'),
('3b6a9539-a148-4b59-9069-2be8214c9513', 'Nguyễn Đức', 'nguyenduc.pt@email.com', '+84910000049', '1990-02-12', 1, '550e8400-e29b-41d4-a716-446655440000'),
('344e348d-e233-43d3-a478-15710bd397eb', 'Lương Văn Toàn', 'luongvan.pt@email.com', '+84910000050', '1988-09-05', 1, '550e8400-e29b-41d4-a716-446655440000'),
('b5e6b7c8-7903-48ee-b326-5a3592e2df17', 'Cao Văn Bảo', 'caovan.pt@email.com', '+84910000051', '1995-12-20', 1, '550e8400-e29b-41d4-a716-446655440000'),
('a366ab82-64d1-4461-bd5a-37e0fad7b005', 'Nhựt Minh', 'nhutminh.pt@email.com', '+84910000052', '1992-03-15', 1, '550e8400-e29b-41d4-a716-446655440000'),
('2ad39f94-996b-4f08-b15d-a492174265e2', 'Trần Quang Đại', 'tranquang.pt@email.com', '+84910000053', '1991-06-28', 1, '550e8400-e29b-41d4-a716-446655440000'),
('8799121e-d163-4b8b-b27b-201ddd132342', 'Nguyễn Huệ', 'nguyenhue.pt@email.com', '+84910000054', '1994-10-02', 2, '550e8400-e29b-41d4-a716-446655440000'),
('6230d895-73d6-4cce-801a-20d35246975c', 'Lê Hùng', 'lehue.pt@email.com', '+84910000055', '1993-01-18', 1, '550e8400-e29b-41d4-a716-446655440000'),
('a2a40b8d-7790-4991-b772-319566cc67e1', 'Phạm Hùng', 'phamhung.pt@email.com', '+84910000056', '1990-04-25', 1, '550e8400-e29b-41d4-a716-446655440000'),
('48185c91-01d0-4ccc-9836-71645724ee3a', 'Hồ Thanh Tùng', 'hothanh.pt@email.com', '+84910000057', '1992-07-09', 1, '550e8400-e29b-41d4-a716-446655440000'),
('e281f03d-154c-45cf-a980-5c9d91f0008f', 'Lưu Minh Đức', 'luuminh.pt@email.com', '+84910000058', '1995-11-13', 1, '550e8400-e29b-41d4-a716-446655440000'),
('f3d842ce-cbec-4c4a-a977-b692308adab0', 'Triệu Văn Lâm', 'trieuvan.pt@email.com', '+84910000059', '1989-02-27', 1, '550e8400-e29b-41d4-a716-446655440000'),
('31847ae3-442c-48ef-ad94-f24528a9c9b5', 'Khắc Nhuanh', 'khacnhuanh.pt@email.com', '+84910000060', '1991-08-04', 1, '550e8400-e29b-41d4-a716-446655440000'),
('8f604e8e-aa8c-4ac1-9a18-c872a9389941', 'Trần Duy', 'tranduy.pt@email.com', '+84910000061', '1994-05-16', 1, '550e8400-e29b-41d4-a716-446655440000'),
('e2eda81c-d7fe-45e1-8f3d-e2fc0b5c9b76', 'Nguyễn Bảo', 'nguyenbao.pt@email.com', '+84910000062', '1993-09-23', 1, '550e8400-e29b-41d4-a716-446655440000'),
('a1f22b12-edb6-4bd0-8f7a-748fab705c14', 'Lê Đức Luận', 'leducluan.pt@email.com', '+84910000063', '1990-12-07', 1, '550e8400-e29b-41d4-a716-446655440000'),
('59c74179-1f65-46d5-b147-2c4eb65b8048', 'Hoàng Thanh', 'hoangthanh.pt@email.com', '+84910000064', '1992-06-11', 1, '550e8400-e29b-41d4-a716-446655440000'),
('311e062b-f20d-4129-95f9-288e404a0da3', 'Trần Thanh', 'tranthanh.pt@email.com', '+84910000065', '1991-03-29', 1, '550e8400-e29b-41d4-a716-446655440000'),
('b48f58a8-7b47-4040-84c5-487cd89e94cf', 'Đinh Huy', 'dinhhuy.pt@email.com', '+84910000066', '1994-10-21', 1, '550e8400-e29b-41d4-a716-446655440000'),
('063326f1-fca2-4d9c-963e-e463278e1910', 'Thảo Trinh', 'thaotrinh.pt@email.com', '+84910000067', '1993-07-04', 2, '550e8400-e29b-41d4-a716-446655440000'),
('60c000f4-4c39-4ad7-acde-a7e4c15d8a4a', 'Vũ Việt', 'vuviet.pt@email.com', '+84910000068', '1990-01-15', 1, '550e8400-e29b-41d4-a716-446655440000'),
('26d6b123-7d1b-4cca-95cc-0d58234cc666', 'Đặng Quang', 'dangquang.pt@email.com', '+84910000069', '1995-08-28', 1, '550e8400-e29b-41d4-a716-446655440000'),
('0332fe32-a77a-48f9-885a-61921822487f', 'Nguyễn Việt', 'nguyenviet.pt@email.com', '+84910000070', '1992-04-12', 1, '550e8400-e29b-41d4-a716-446655440000'),
('b007710e-640a-482b-9bac-896caf25346c', 'Phạm Quốc', 'phamquoc.pt@email.com', '+84910000071', '1991-11-25', 1, '550e8400-e29b-41d4-a716-446655440000'),
('1ea1fa23-394e-4cbb-ab32-45a7b0b59797', 'Bùi Quân', 'buiquan.pt@email.com', '+84910000072', '1994-02-08', 1, '550e8400-e29b-41d4-a716-446655440000'),
('69987294-46f6-4a2b-b228-0916177d8a23', 'Nguyễn Xuân', 'nguyenxuan.pt@email.com', '+84910000073', '1993-05-19', 1, '550e8400-e29b-41d4-a716-446655440000'),
('318cb504-2283-424b-8922-e578675f060d', 'Lê Hồng', 'lehong.pt@email.com', '+84910000074', '1990-09-02', 2, '550e8400-e29b-41d4-a716-446655440000'),
('96ce6cac-4cd0-4fa1-a527-67532e4f93f5', 'Trần Hữu', 'tranhuu.pt@email.com', '+84910000075', '1995-12-14', 1, '550e8400-e29b-41d4-a716-446655440000'),
('ba2fafc6-4b21-474a-b938-9c6f583dcb7e', 'Đặng Thu Hiền', 'dangthu.pt@email.com', '+84910000076', '1992-06-27', 2, '550e8400-e29b-41d4-a716-446655440000'),
('d7af2ff6-8f96-402e-b3d1-dc0168646ab0', 'Nguyễn Hòa', 'nguyenhoa.pt@email.com', '+84910000077', '1991-03-10', 1, '550e8400-e29b-41d4-a716-446655440000'),
('17afd4c5-f617-4d1d-9add-7437787f4406', 'Lương Phú', 'luongphu.pt@email.com', '+84910000078', '1994-08-23', 1, '550e8400-e29b-41d4-a716-446655440000'),
('b6d6bedd-3f6a-4793-b093-ad8a705049ac', 'Hoàng Long', 'hoanglong.pt@email.com', '+84910000079', '1993-01-06', 1, '550e8400-e29b-41d4-a716-446655440000'),
('f71e4234-43ec-4e58-b1f6-884a0451e1b4', 'Nguyễn Tân', 'nguyentan.pt@email.com', '+84910000080', '1990-07-19', 1, '550e8400-e29b-41d4-a716-446655440000'),
('84ff62c4-8c9f-4bed-9f2a-88dfdf22ab18', 'Chu Công', 'chucong.pt@email.com', '+84910000081', '1995-10-02', 1, '550e8400-e29b-41d4-a716-446655440000'),
('c08e5a19-158d-47e6-af6c-daf26b476f97', 'Lê Việt', 'leviet.pt@email.com', '+84910000082', '1992-04-15', 1, '550e8400-e29b-41d4-a716-446655440000'),
('bd22b481-f060-4438-82f2-10c089c23a82', 'Phạm Ngọc', 'phamngoc.pt@email.com', '+84910000083', '1991-11-28', 2, '550e8400-e29b-41d4-a716-446655440000'),
('7c070fbb-a57d-438e-9767-ae18f73632c3', 'Nguyễn Lam', 'nguyenlam.pt@email.com', '+84910000084', '1994-02-11', 1, '550e8400-e29b-41d4-a716-446655440000'),
('8e8ca1d2-453d-4665-b2fb-e9e477dfd556', 'Trần Lam', 'tranlam.pt@email.com', '+84910000085', '1993-09-24', 2, '550e8400-e29b-41d4-a716-446655440000'),
('7fb8eaef-92f3-4e06-b7b4-930295908819', 'Bùi Hoàng', 'buihoang.pt@email.com', '+84910000086', '1990-12-07', 1, '550e8400-e29b-41d4-a716-446655440000'),
('bc79d5ae-39d0-4a42-9d13-923be87ca7da', 'Lê Hữu', 'lehuu.pt@email.com', '+84910000087', '1995-05-20', 1, '550e8400-e29b-41d4-a716-446655440000'),
('1c801831-c576-4fbe-923a-628dd58f01ae', 'Vũ Văn', 'vuvan.pt@email.com', '+84910000088', '1992-08-03', 1, '550e8400-e29b-41d4-a716-446655440000'),
('19711d52-bdcb-4c2b-919f-8c6ce0f8845b', 'Đặng Thị Yến', 'dangthi.pt@email.com', '+84910000089', '1991-01-16', 2, '550e8400-e29b-41d4-a716-446655440000'),
('3d033896-71e3-4cd8-8677-5fa2b8f376ae', 'Nguyễn Vũ', 'nguyenvu.pt@email.com', '+84910000090', '1994-06-29', 1, '550e8400-e29b-41d4-a716-446655440000'),
('3cdbe831-5fdc-4137-b6b6-286b7e6e192f', 'Trần Văn Khôi', 'tranvan.pt@email.com', '+84910000091', '1993-03-12', 1, '550e8400-e29b-41d4-a716-446655440000'),
('04e12d56-02ff-48c4-8c22-e1af10376445', 'Phạm Văn Minh', 'phamvan.pt@email.com', '+84910000092', '1990-10-25', 1, '550e8400-e29b-41d4-a716-446655440000'),
('df46f5cb-5c2a-475c-9aa2-c8b78a27db59', 'Hoàng Vũ', 'hoangvu.pt@email.com', '+84910000093', '1995-07-08', 1, '550e8400-e29b-41d4-a716-446655440000'),
('62931391-47cf-496d-886e-796f08e2ffe1', 'Ban Nguyên', 'banguyen.pt@email.com', '+84910000094', '1992-12-21', 2, '550e8400-e29b-41d4-a716-446655440000'),
('806c061b-3e1b-471f-bb30-b3b7596766d9', 'Đinh Phú', 'dinhphu.pt@email.com', '+84910000095', '1991-05-04', 1, '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (user_id) DO NOTHING;

-- Assign Roles to Users
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT role_id FROM roles WHERE role_name = 'ADMIN'), '550e8400-e29b-41d4-a716-446655440000'),
('c8be5977-44f1-4f1c-ad46-58479cd52d37', (SELECT role_id FROM roles WHERE role_name = 'DOCTOR'), '550e8400-e29b-41d4-a716-446655440000'),
('c90773ba-3bed-4879-b1fa-d39ca9eee127', (SELECT role_id FROM roles WHERE role_name = 'DOCTOR'), '550e8400-e29b-41d4-a716-446655440000'),
('788965d4-e3e3-451d-bdcb-2577eb6d17fc', (SELECT role_id FROM roles WHERE role_name = 'DOCTOR'), '550e8400-e29b-41d4-a716-446655440000'),
('a1263dc8-5bc9-451a-95dd-242ef757efe4', (SELECT role_id FROM roles WHERE role_name = 'DOCTOR'), '550e8400-e29b-41d4-a716-446655440000'),
('9d2bf998-10b6-435b-9950-c16682a4fbd1', (SELECT role_id FROM roles WHERE role_name = 'DOCTOR'), '550e8400-e29b-41d4-a716-446655440000'),
('61e1c766-cd7b-4978-b635-2999615f4f4a', (SELECT role_id FROM roles WHERE role_name = 'DOCTOR'), '550e8400-e29b-41d4-a716-446655440000'),
('ab014405-2237-4646-a20c-af5049173dc2', (SELECT role_id FROM roles WHERE role_name = 'DOCTOR'), '550e8400-e29b-41d4-a716-446655440000'),
('58f1a9b4-82ce-445d-8c77-401a307d0857', (SELECT role_id FROM roles WHERE role_name = 'DOCTOR'), '550e8400-e29b-41d4-a716-446655440000'),
('e9c36fc2-6fce-4294-8213-6f83e96380f8', (SELECT role_id FROM roles WHERE role_name = 'DOCTOR'), '550e8400-e29b-41d4-a716-446655440000'),
('57557882-c134-49f7-837e-cebd3ef950f5', (SELECT role_id FROM roles WHERE role_name = 'DOCTOR'), '550e8400-e29b-41d4-a716-446655440000'),
('e87bf6f2-d578-4e5c-afda-9ca74dd54abb', (SELECT role_id FROM roles WHERE role_name = 'RECEPTIONIST'), '550e8400-e29b-41d4-a716-446655440000'),
('87a4ce64-346c-44c6-8aff-d7f2f87c1dfe', (SELECT role_id FROM roles WHERE role_name = 'RECEPTIONIST'), '550e8400-e29b-41d4-a716-446655440000'),
('1c7d3569-7d7a-4da5-b343-bef19a17bb4d', (SELECT role_id FROM roles WHERE role_name = 'RECEPTIONIST'), '550e8400-e29b-41d4-a716-446655440000'),
('50d83bbd-275e-4154-ac65-6a0a504bcdb0', (SELECT role_id FROM roles WHERE role_name = 'RECEPTIONIST'), '550e8400-e29b-41d4-a716-446655440000'),
('53aeaf0f-f3b6-4493-ae3e-2d2a131f9d05', (SELECT role_id FROM roles WHERE role_name = 'RECEPTIONIST'), '550e8400-e29b-41d4-a716-446655440000'),
('00e1cbd4-6862-4ebe-9cac-9c17b6a20ed4', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('c81c963c-80a4-4f6d-8738-615e076c5c05', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('fd2effb8-ed52-40a4-bb22-c82475918aae', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('f9c58efa-0b33-40ad-b034-b88c6013d25d', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('9d27034d-8445-4459-a6c3-f191c9546e6b', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('364c8a87-5c44-4b95-8617-2d01773ff2e3', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('20514b0d-0898-49e8-8832-edce947133d2', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('a191faec-6be1-43c1-9452-1590e4d2bb81', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('1dfe6dd7-2578-4c7b-9bfa-a8630ec7b5b7', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('4fa61ae3-64a5-4d07-b478-adc74c5a8268', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('a960830b-a26b-4552-867e-5335076cffc9', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('1cb53dd7-af84-4be0-9dba-85ac8e2284e3', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('ef657d8a-3ffb-4988-adae-11d1ad866db5', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('26aaeb1f-efd8-427b-82b0-b343bee7c7cf', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('1e55b494-a921-4fff-b223-eb8840f22476', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('13594230-002c-46d3-91b7-a22bbc0393b1', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('d376531a-0c27-467f-ad77-a95378ee38cc', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('035b4e35-4d4a-4f76-8b87-9bb6d8bc7171', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('374599b9-bfe8-49f1-a9f0-37ea5794e876', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('27a01e0c-2b80-434c-8723-7766bda0db89', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('58a368c9-2009-46a6-92f8-f14168cab2bf', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('69478c24-4b6b-4b4b-b67c-134407fbc02f', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('6752b19b-992b-40a1-95e4-37149ab16375', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('eea85b6f-64d0-4364-9be8-5d331cd0ae52', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('b41262a8-f0e6-4ed3-b80c-4e01d831d101', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('2194e321-afb5-47e2-8440-ec88f24cfc99', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('74e8ea90-d60c-4cd2-a68c-2898897a5bc6', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('7613d405-d7d6-40b2-83c0-5c8d41ea8553', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('cb1e528c-fa6c-41ff-aefe-e5793475af53', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('7c2c71d0-88c1-4eb1-909f-ab5425206825', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('07e35dcd-c091-40eb-88e3-afa4a56becde', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('716a917e-adc7-4d18-9392-0c14f7a99288', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('57c8b24b-35ce-48e2-bdcb-2499b4a2901b', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('b0604009-bb1f-427c-9849-2cb8a0814d06', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('bee663d5-828d-4d9c-be81-5a5b14c07454', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('ce2604d4-20c0-4a53-8549-ce08b521dcd5', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('f3158977-ba56-453a-855c-20c51aaccf1f', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('8a87f5ed-b5c4-472a-95a5-a1a65aba105b', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('3b6a9539-a148-4b59-9069-2be8214c9513', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('344e348d-e233-43d3-a478-15710bd397eb', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('b5e6b7c8-7903-48ee-b326-5a3592e2df17', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('a366ab82-64d1-4461-bd5a-37e0fad7b005', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('2ad39f94-996b-4f08-b15d-a492174265e2', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('8799121e-d163-4b8b-b27b-201ddd132342', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('6230d895-73d6-4cce-801a-20d35246975c', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('a2a40b8d-7790-4991-b772-319566cc67e1', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('48185c91-01d0-4ccc-9836-71645724ee3a', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('e281f03d-154c-45cf-a980-5c9d91f0008f', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('f3d842ce-cbec-4c4a-a977-b692308adab0', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('31847ae3-442c-48ef-ad94-f24528a9c9b5', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('8f604e8e-aa8c-4ac1-9a18-c872a9389941', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('e2eda81c-d7fe-45e1-8f3d-e2fc0b5c9b76', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('a1f22b12-edb6-4bd0-8f7a-748fab705c14', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('59c74179-1f65-46d5-b147-2c4eb65b8048', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('311e062b-f20d-4129-95f9-288e404a0da3', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('b48f58a8-7b47-4040-84c5-487cd89e94cf', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('063326f1-fca2-4d9c-963e-e463278e1910', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('60c000f4-4c39-4ad7-acde-a7e4c15d8a4a', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('26d6b123-7d1b-4cca-95cc-0d58234cc666', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('0332fe32-a77a-48f9-885a-61921822487f', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('b007710e-640a-482b-9bac-896caf25346c', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('1ea1fa23-394e-4cbb-ab32-45a7b0b59797', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('69987294-46f6-4a2b-b228-0916177d8a23', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('318cb504-2283-424b-8922-e578675f060d', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('96ce6cac-4cd0-4fa1-a527-67532e4f93f5', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('ba2fafc6-4b21-474a-b938-9c6f583dcb7e', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('d7af2ff6-8f96-402e-b3d1-dc0168646ab0', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('17afd4c5-f617-4d1d-9add-7437787f4406', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('b6d6bedd-3f6a-4793-b093-ad8a705049ac', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('f71e4234-43ec-4e58-b1f6-884a0451e1b4', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('84ff62c4-8c9f-4bed-9f2a-88dfdf22ab18', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('c08e5a19-158d-47e6-af6c-daf26b476f97', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('bd22b481-f060-4438-82f2-10c089c23a82', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('7c070fbb-a57d-438e-9767-ae18f73632c3', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('8e8ca1d2-453d-4665-b2fb-e9e477dfd556', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('7fb8eaef-92f3-4e06-b7b4-930295908819', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('bc79d5ae-39d0-4a42-9d13-923be87ca7da', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('1c801831-c576-4fbe-923a-628dd58f01ae', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('19711d52-bdcb-4c2b-919f-8c6ce0f8845b', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('3d033896-71e3-4cd8-8677-5fa2b8f376ae', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('3cdbe831-5fdc-4137-b6b6-286b7e6e192f', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('04e12d56-02ff-48c4-8c22-e1af10376445', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('df46f5cb-5c2a-475c-9aa2-c8b78a27db59', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('62931391-47cf-496d-886e-796f08e2ffe1', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000'),
('806c061b-3e1b-471f-bb30-b3b7596766d9', (SELECT role_id FROM roles WHERE role_name = 'PATIENT'), '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- Sample Phone Verifications (Some patients verified, some not)
INSERT INTO phone_verifications (user_id, phone, is_verified, verified_at) VALUES
('00e1cbd4-6862-4ebe-9cac-9c17b6a20ed4', '+84910000011', true, '2025-06-15 10:35:00'),
('c81c963c-80a4-4f6d-8738-615e076c5c05', '+84910000012', true, '2025-06-16 14:25:00'),
('fd2effb8-ed52-40a4-bb22-c82475918aae', '+84910000013', true, '2025-07-01 09:20:00'),
('f9c58efa-0b33-40ad-b034-b88c6013d25d', '+84910000014', true, '2025-07-05 11:50:00'),
('9d27034d-8445-4459-a6c3-f191c9546e6b', '+84910000015', false, NULL),
('364c8a87-5c44-4b95-8617-2d01773ff2e3', '+84910000016', true, '2025-07-12 08:35:00'),
('20514b0d-0898-49e8-8832-edce947133d2', '+84910000017', true, '2025-07-18 13:25:00'),
('a191faec-6be1-43c1-9452-1590e4d2bb81', '+84910000018', false, NULL),
('1dfe6dd7-2578-4c7b-9bfa-a8630ec7b5b7', '+84910000019', true, '2025-08-01 15:50:00'),
('4fa61ae3-64a5-4d07-b478-adc74c5a8268', '+84910000020', true, '2025-08-05 09:35:00')
ON CONFLICT DO NOTHING;

-- Sample Digital Signatures (for doctors)
-- Digital Signature is a dropped feature (out of product scope) — the digital_signatures
-- table schema doesn't include signature_hash, so this insert is disabled rather than guessed.
-- INSERT INTO digital_signatures (user_id, signature_data, signature_hash, is_active, description, created_by) VALUES
-- ('c8be5977-44f1-4f1c-ad46-58479cd52d37', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'hash_dr001_2026', true, 'Digital signature for Dr. Nguyen Van A', '550e8400-e29b-41d4-a716-446655440000'),
-- ('c90773ba-3bed-4879-b1fa-d39ca9eee127', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'hash_dr002_2026', true, 'Digital signature for Dr. Tran Thi B', '550e8400-e29b-41d4-a716-446655440000'),
-- ('788965d4-e3e3-451d-bdcb-2577eb6d17fc', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'hash_dr003_2026', true, 'Digital signature for Dr. Le Van C', '550e8400-e29b-41d4-a716-446655440000')
-- ON CONFLICT DO NOTHING;