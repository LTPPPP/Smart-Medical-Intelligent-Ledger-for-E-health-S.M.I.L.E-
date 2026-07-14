-- ============================================
-- SAMPLE DATA FOR USER SERVICE
-- Realistic Vietnamese data with ~100 users
-- Note: user_id must match account_id in auth_service_db.accounts
-- ============================================

-- Roles
INSERT INTO roles (role_id, role_name, description) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', 'System Administrator with full access'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'doctor', 'Medical Doctor with patient management access'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'receptionist', 'Front desk staff with appointment management access'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'patient', 'Regular patient with limited access')
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
WHERE r.role_name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign Basic Permissions to Doctor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'doctor' AND (
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
WHERE r.role_name = 'receptionist' AND (
    p.permission_name LIKE 'user.read' OR
    p.permission_name LIKE 'appointment.%' OR
    p.permission_name LIKE 'payment.%'
)
ON CONFLICT DO NOTHING;

-- User Profiles - Admin
INSERT INTO users (user_id, full_name, email, phone, date_of_birth, gender, avatar_url, created_by) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Nguyễn Văn Quản Lý', 'admin@smile.com', '+84111111111', '1975-03-15', 'MALE', 'https://storage.smile.com/avatars/admin001.jpg', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (user_id) DO NOTHING;

-- User Profiles - Doctors (10)
INSERT INTO users (user_id, full_name, email, phone, date_of_birth, gender, avatar_url, created_by) VALUES 
('d0000001-0001-0001-0001-000000000001', 'BS. Nguyễn Văn A', 'dr.nguyenvana@smile.com', '+84900000001', '1980-05-15', 'MALE', 'https://storage.smile.com/avatars/dr001.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000002', 'BS. Trần Thị B', 'dr.tranthib@smile.com', '+84900000002', '1985-03-22', 'FEMALE', 'https://storage.smile.com/avatars/dr002.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000003', 'BS. Lê Văn C', 'dr.levanc@smile.com', '+84900000003', '1978-08-10', 'MALE', 'https://storage.smile.com/avatars/dr003.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000004', 'BS. Phạm Thị D', 'dr.phamthid@smile.com', '+84900000004', '1982-11-25', 'FEMALE', 'https://storage.smile.com/avatars/dr004.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000005', 'BS. Hoàng Văn E', 'dr.hoangvane@smile.com', '+84900000005', '1975-07-08', 'MALE', 'https://storage.smile.com/avatars/dr005.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000006', 'BS. Nguyễn Thị F', 'dr.nguyenthif@smile.com', '+84900000006', '1988-01-20', 'FEMALE', 'https://storage.smile.com/avatars/dr006.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000007', 'BS. Bùi Hữu G', 'dr.buihuug@smile.com', '+84900000007', '1983-09-05', 'MALE', 'https://storage.smile.com/avatars/dr007.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000008', 'BS. Đỗ Quang H', 'dr.doquangh@smile.com', '+84900000008', '1979-04-18', 'MALE', 'https://storage.smile.com/avatars/dr008.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000009', 'BS. Trần Quang I', 'dr.tranquangi@smile.com', '+84900000009', '1986-12-30', 'MALE', 'https://storage.smile.com/avatars/dr009.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000010', 'BS. Võ Thanh J', 'dr.vothanhj@smile.com', '+84900000010', '1981-06-22', 'MALE', 'https://storage.smile.com/avatars/dr010.jpg', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (user_id) DO NOTHING;

-- User Profiles - Receptionists (5)
INSERT INTO users (user_id, full_name, email, phone, date_of_birth, gender, avatar_url, created_by) VALUES 
('r0000001-0001-0001-0001-000000000001', 'Lê Văn Tiếp Nhận', 'recep.levan@smile.com', '+84910000001', '1992-02-14', 'MALE', 'https://storage.smile.com/avatars/recep001.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('r0000001-0001-0001-0001-000000000002', 'Nguyễn Thị K', 'recep.nguyenthik@smile.com', '+84910000002', '1995-05-20', 'FEMALE', 'https://storage.smile.com/avatars/recep002.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('r0000001-0001-0001-0001-000000000003', 'Trần Thị L', 'recep.tranthil@smile.com', '+84910000003', '1993-08-08', 'FEMALE', 'https://storage.smile.com/avatars/recep003.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('r0000001-0001-0001-0001-000000000004', 'Phạm Văn M', 'recep.phamvanm@smile.com', '+84910000004', '1990-11-12', 'MALE', 'https://storage.smile.com/avatars/recep004.jpg', '550e8400-e29b-41d4-a716-446655440000'),
('r0000001-0001-0001-0001-000000000005', 'Hoàng Thị N', 'recep.hoangthin@smile.com', '+84910000005', '1994-03-25', 'FEMALE', 'https://storage.smile.com/avatars/recep005.jpg', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (user_id) DO NOTHING;

-- User Profiles - Patients (85)
INSERT INTO users (user_id, full_name, email, phone, date_of_birth, gender, created_by) VALUES 
('p0000001-0001-0001-0001-000000000001', 'Nguyễn Văn An', 'nguyenvana.pt@email.com', '+84910000011', '1995-06-15', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000002', 'Trần Thị Bình', 'tranthib.pt@email.com', '+84910000012', '1992-07-20', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000003', 'Lê Văn Cường', 'levanc.pt@email.com', '+84910000013', '1988-03-10', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000004', 'Phạm Thị Duyên', 'phamthid.pt@email.com', '+84910000014', '1990-09-25', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000005', 'Hoàng Văn Em', 'hoangvane.pt@email.com', '+84910000015', '1985-12-08', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000006', 'Đỗ Thị Phương', 'dongthif.pt@email.com', '+84910000016', '1993-04-18', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000007', 'Bùi Hữu Gia', 'buihuug.pt@email.com', '+84910000017', '1991-08-22', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000008', 'Đặng Văn Hùng', 'dangvnh.pt@email.com', '+84910000018', '1987-01-30', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000009', 'Dương Thị Hương', 'duongthj.pt@email.com', '+84910000019', '1994-06-12', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000010', 'Trần Văn Khoa', 'tranvanh.pt@email.com', '+84910000020', '1996-10-05', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000011', 'Võ Thị Lan', 'vothik.pt@email.com', '+84910000021', '1989-02-28', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000012', 'Cô Thị Linh', 'cothil.pt@email.com', '+84910000022', '1997-05-14', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000013', 'Thành Minh', 'thanhm.pt@email.com', '+84910000023', '1992-11-03', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000014', 'Nguyễn Thanh Vân', 'ngthanhvn.pt@email.com', '+84910000024', '1991-07-19', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000015', 'Lê Thị Kim', 'lthikg.pt@email.com', '+84910000025', '1994-09-08', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000016', 'Trần Hữu Phúc', 'tranhuup.pt@email.com', '+84910000026', '1993-03-27', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000017', 'Phan Thị Thu', 'phanthir.pt@email.com', '+84910000027', '1990-12-15', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000018', 'Lê Văn Sơn', 'levans.pt@email.com', '+84910000028', '1988-06-22', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000019', 'Nguyễn Việt Quang', 'ngvietq.pt@email.com', '+84910000029', '1995-08-11', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000020', 'Chu Văn Tài', 'chuongt.pt@email.com', '+84910000030', '1992-01-05', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000021', 'Hồ Thị Thanh', 'hongthiu.pt@email.com', '+84910000031', '1991-04-18', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000022', 'Nguyễn Minh Tuấn', 'ngminhw.pt@email.com', '+84910000032', '1994-10-30', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000023', 'Ba Thanh Xuân', 'bathanhx.pt@email.com', '+84910000033', '1993-07-12', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000024', 'Đặng Huy', 'ductuanm.pt@email.com', '+84910000034', '1989-02-25', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000025', 'Trần Thanh Hùng', 'thanhhuy.pt@email.com', '+84910000035', '1990-05-08', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000026', 'Nguyễn Thanh Hải', 'thanhhai.pt@email.com', '+84910000036', '1996-11-22', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000027', 'Hồng Ngọc', 'hongngoc.pt@email.com', '+84910000037', '1992-08-15', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000028', 'Quốc Trung', 'quoctrinh.pt@email.com', '+84910000038', '1991-03-03', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000029', 'Việt Anh', 'vietanh.pt@email.com', '+84910000039', '1994-09-28', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000030', 'Minh Tường', 'minhtuong.pt@email.com', '+84910000040', '1993-06-17', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000031', 'Thanh Lộc', 'thanhloc.pt@email.com', '+84910000041', '1987-12-01', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000032', 'Trương Giang', 'truonggiang.pt@email.com', '+84910000042', '1995-04-23', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000033', 'Ngọc Linh', 'ngoclinh.pt@email.com', '+84910000043', '1992-10-09', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000034', 'Phương Thảo', 'phuongthao.pt@email.com', '+84910000044', '1990-01-14', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000035', 'Nguyễn Hoàng', 'nguyenhoang.pt@email.com', '+84910000045', '1994-07-26', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000036', 'Hà Tấn Thành', 'hathanh.pt@email.com', '+84910000046', '1991-11-08', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000037', 'Trần Kim Oanh', 'trankim.pt@email.com', '+84910000047', '1989-05-19', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000038', 'Đỗ Huy', 'dohuy.pt@email.com', '+84910000048', '1993-08-31', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000039', 'Nguyễn Đức', 'nguyenduc.pt@email.com', '+84910000049', '1990-02-12', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000040', 'Lương Văn Toàn', 'luongvan.pt@email.com', '+84910000050', '1988-09-05', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000041', 'Cao Văn Bảo', 'caovan.pt@email.com', '+84910000051', '1995-12-20', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000042', 'Nhựt Minh', 'nhutminh.pt@email.com', '+84910000052', '1992-03-15', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000043', 'Trần Quang Đại', 'tranquang.pt@email.com', '+84910000053', '1991-06-28', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000044', 'Nguyễn Huệ', 'nguyenhue.pt@email.com', '+84910000054', '1994-10-02', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000045', 'Lê Hùng', 'lehue.pt@email.com', '+84910000055', '1993-01-18', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000046', 'Phạm Hùng', 'phamhung.pt@email.com', '+84910000056', '1990-04-25', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000047', 'Hồ Thanh Tùng', 'hothanh.pt@email.com', '+84910000057', '1992-07-09', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000048', 'Lưu Minh Đức', 'luuminh.pt@email.com', '+84910000058', '1995-11-13', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000049', 'Triệu Văn Lâm', 'trieuvan.pt@email.com', '+84910000059', '1989-02-27', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000050', 'Khắc Nhuanh', 'khacnhuanh.pt@email.com', '+84910000060', '1991-08-04', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000051', 'Trần Duy', 'tranduy.pt@email.com', '+84910000061', '1994-05-16', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000052', 'Nguyễn Bảo', 'nguyenbao.pt@email.com', '+84910000062', '1993-09-23', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000053', 'Lê Đức Luận', 'leducluan.pt@email.com', '+84910000063', '1990-12-07', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000054', 'Hoàng Thanh', 'hoangthanh.pt@email.com', '+84910000064', '1992-06-11', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000055', 'Trần Thanh', 'tranthanh.pt@email.com', '+84910000065', '1991-03-29', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000056', 'Đinh Huy', 'dinhhuy.pt@email.com', '+84910000066', '1994-10-21', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000057', 'Thảo Trinh', 'thaotrinh.pt@email.com', '+84910000067', '1993-07-04', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000058', 'Vũ Việt', 'vuviet.pt@email.com', '+84910000068', '1990-01-15', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000059', 'Đặng Quang', 'dangquang.pt@email.com', '+84910000069', '1995-08-28', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000060', 'Nguyễn Việt', 'nguyenviet.pt@email.com', '+84910000070', '1992-04-12', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000061', 'Phạm Quốc', 'phamquoc.pt@email.com', '+84910000071', '1991-11-25', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000062', 'Bùi Quân', 'buiquan.pt@email.com', '+84910000072', '1994-02-08', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000063', 'Nguyễn Xuân', 'nguyenxuan.pt@email.com', '+84910000073', '1993-05-19', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000064', 'Lê Hồng', 'lehong.pt@email.com', '+84910000074', '1990-09-02', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000065', 'Trần Hữu', 'tranhuu.pt@email.com', '+84910000075', '1995-12-14', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000066', 'Đặng Thu Hiền', 'dangthu.pt@email.com', '+84910000076', '1992-06-27', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000067', 'Nguyễn Hòa', 'nguyenhoa.pt@email.com', '+84910000077', '1991-03-10', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000068', 'Lương Phú', 'luongphu.pt@email.com', '+84910000078', '1994-08-23', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000069', 'Hoàng Long', 'hoanglong.pt@email.com', '+84910000079', '1993-01-06', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000070', 'Nguyễn Tân', 'nguyentan.pt@email.com', '+84910000080', '1990-07-19', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000071', 'Chu Công', 'chucong.pt@email.com', '+84910000081', '1995-10-02', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000072', 'Lê Việt', 'leviet.pt@email.com', '+84910000082', '1992-04-15', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000073', 'Phạm Ngọc', 'phamngoc.pt@email.com', '+84910000083', '1991-11-28', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000074', 'Nguyễn Lam', 'nguyenlam.pt@email.com', '+84910000084', '1994-02-11', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000075', 'Trần Lam', 'tranlam.pt@email.com', '+84910000085', '1993-09-24', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000076', 'Bùi Hoàng', 'buihoang.pt@email.com', '+84910000086', '1990-12-07', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000077', 'Lê Hữu', 'lehuu.pt@email.com', '+84910000087', '1995-05-20', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000078', 'Vũ Văn', 'vuvan.pt@email.com', '+84910000088', '1992-08-03', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000079', 'Đặng Thị Yến', 'dangthi.pt@email.com', '+84910000089', '1991-01-16', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000080', 'Nguyễn Vũ', 'nguyenvu.pt@email.com', '+84910000090', '1994-06-29', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000081', 'Trần Văn Khôi', 'tranvan.pt@email.com', '+84910000091', '1993-03-12', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000082', 'Phạm Văn Minh', 'phamvan.pt@email.com', '+84910000092', '1990-10-25', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000083', 'Hoàng Vũ', 'hoangvu.pt@email.com', '+84910000093', '1995-07-08', 'MALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000084', 'Ban Nguyên', 'banguyen.pt@email.com', '+84910000094', '1992-12-21', 'FEMALE', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000085', 'Đinh Phú', 'dinhphu.pt@email.com', '+84910000095', '1991-05-04', 'MALE', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (user_id) DO NOTHING;

-- Assign Roles to Users
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT role_id FROM roles WHERE role_name = 'admin'), '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000001', (SELECT role_id FROM roles WHERE role_name = 'doctor'), '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000002', (SELECT role_id FROM roles WHERE role_name = 'doctor'), '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000003', (SELECT role_id FROM roles WHERE role_name = 'doctor'), '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000004', (SELECT role_id FROM roles WHERE role_name = 'doctor'), '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000005', (SELECT role_id FROM roles WHERE role_name = 'doctor'), '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000006', (SELECT role_id FROM roles WHERE role_name = 'doctor'), '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000007', (SELECT role_id FROM roles WHERE role_name = 'doctor'), '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000008', (SELECT role_id FROM roles WHERE role_name = 'doctor'), '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000009', (SELECT role_id FROM roles WHERE role_name = 'doctor'), '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000010', (SELECT role_id FROM roles WHERE role_name = 'doctor'), '550e8400-e29b-41d4-a716-446655440000'),
('r0000001-0001-0001-0001-000000000001', (SELECT role_id FROM roles WHERE role_name = 'receptionist'), '550e8400-e29b-41d4-a716-446655440000'),
('r0000001-0001-0001-0001-000000000002', (SELECT role_id FROM roles WHERE role_name = 'receptionist'), '550e8400-e29b-41d4-a716-446655440000'),
('r0000001-0001-0001-0001-000000000003', (SELECT role_id FROM roles WHERE role_name = 'receptionist'), '550e8400-e29b-41d4-a716-446655440000'),
('r0000001-0001-0001-0001-000000000004', (SELECT role_id FROM roles WHERE role_name = 'receptionist'), '550e8400-e29b-41d4-a716-446655440000'),
('r0000001-0001-0001-0001-000000000005', (SELECT role_id FROM roles WHERE role_name = 'receptionist'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000001', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000002', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000003', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000004', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000005', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000006', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000007', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000008', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000009', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000010', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000011', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000012', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000013', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000014', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000015', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000016', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000017', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000018', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000019', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000020', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000021', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000022', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000023', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000024', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000025', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000026', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000027', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000028', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000029', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000030', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000031', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000032', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000033', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000034', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000035', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000036', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000037', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000038', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000039', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000040', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000041', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000042', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000043', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000044', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000045', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000046', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000047', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000048', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000049', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000050', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000051', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000052', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000053', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000054', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000055', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000056', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000057', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000058', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000059', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000060', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000061', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000062', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000063', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000064', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000065', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000066', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000067', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000068', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000069', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000070', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000071', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000072', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000073', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000074', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000075', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000076', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000077', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000078', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000079', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000080', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000081', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000082', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000083', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000084', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0001-0001-0001-000000000085', (SELECT role_id FROM roles WHERE role_name = 'patient'), '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- Sample Phone Verifications (Some patients verified, some not)
INSERT INTO phone_verifications (user_id, phone, is_verified, verified_at) VALUES
('p0000001-0001-0001-0001-000000000001', '+84910000011', true, '2025-06-15 10:35:00'),
('p0000001-0001-0001-0001-000000000002', '+84910000012', true, '2025-06-16 14:25:00'),
('p0000001-0001-0001-0001-000000000003', '+84910000013', true, '2025-07-01 09:20:00'),
('p0000001-0001-0001-0001-000000000004', '+84910000014', true, '2025-07-05 11:50:00'),
('p0000001-0001-0001-0001-000000000005', '+84910000015', false, NULL),
('p0000001-0001-0001-0001-000000000006', '+84910000016', true, '2025-07-12 08:35:00'),
('p0000001-0001-0001-0001-000000000007', '+84910000017', true, '2025-07-18 13:25:00'),
('p0000001-0001-0001-0001-000000000008', '+84910000018', false, NULL),
('p0000001-0001-0001-0001-000000000009', '+84910000019', true, '2025-08-01 15:50:00'),
('p0000001-0001-0001-0001-000000000010', '+84910000020', true, '2025-08-05 09:35:00')
ON CONFLICT DO NOTHING;

-- Sample Digital Signatures (for doctors)
INSERT INTO digital_signatures (user_id, signature_data, signature_hash, is_active, description, created_by) VALUES
('d0000001-0001-0001-0001-000000000001', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'hash_dr001_2026', true, 'Digital signature for Dr. Nguyen Van A', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000002', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'hash_dr002_2026', true, 'Digital signature for Dr. Tran Thi B', '550e8400-e29b-41d4-a716-446655440000'),
('d0000001-0001-0001-0001-000000000003', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'hash_dr003_2026', true, 'Digital signature for Dr. Le Van C', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;