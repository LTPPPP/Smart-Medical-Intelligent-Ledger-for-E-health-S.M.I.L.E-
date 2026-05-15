/**
 * S.M.I.L.E Platform Operation Simulation
 * Interactive workflow visualization for 9 microservices
 */

// ========================================
// Service Definitions
// ========================================

const SERVICES = {
    account: { name: 'Account Service', port: 8081, icon: '👤', color: '#3b82f6' },
    clinic: { name: 'Clinic Service', port: 8082, icon: '🏥', color: '#10b981' },
    appointment: { name: 'Appointment Service', port: 8083, icon: '📅', color: '#f59e0b' },
    patient: { name: 'Patient Media Record', port: 8084, icon: '📋', color: '#ef4444' },
    schedule: { name: 'Schedule Service', port: 8085, icon: '🗓️', color: '#8b5cf6' },
    services: { name: 'Service Service', port: 8086, icon: '🦷', color: '#06b6d4' },
    examination: { name: 'Examination Service', port: 8087, icon: '🩺', color: '#ec4899' },
    imaging: { name: 'Dental Image Service', port: 8088, icon: '📷', color: '#14b8a6' },
    blockchain: { name: 'Blockchain Service', port: 8090, icon: '⛓️', color: '#6366f1' }
};

// ========================================
// Workflow Definitions
// ========================================

const WORKFLOWS = {
    // Account Service Workflows
    'user-login': {
        service: 'account',
        name: 'UC-002: User Login',
        description: 'JWT authentication with access/refresh tokens',
        nodes: [
            { id: 'client', name: 'Client', icon: '💻', type: 'Web/Mobile' },
            { id: 'gateway', name: 'API Gateway', icon: '🌐', type: 'Spring Cloud' },
            { id: 'account', name: 'Account Service', icon: '👤', type: 'Port 8081' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'User DB' },
            { id: 'jwt', name: 'JWT', icon: '🔑', type: 'HS512' }
        ],
        steps: [
            { from: 'client', to: 'gateway', name: 'Submit Credentials', description: 'Gửi username/password qua HTTPS', log: 'POST /api/auth/login - credentials received', data: { endpoint: '/api/auth/login' } },
            { from: 'gateway', to: 'account', name: 'Route Request', description: 'Gateway định tuyến đến Account Service', log: 'Routing to account-service:8081', data: { targetService: 'account-service' } },
            { from: 'account', to: 'db', name: 'Query User', description: 'Truy vấn thông tin user từ database', log: 'SELECT * FROM users WHERE username = ?', data: { table: 'users' } },
            { from: 'db', to: 'account', name: 'Return User Data', description: 'Trả về user với hashed password', log: 'User found: id=1, roles=[PATIENT]', data: { userId: 1, roles: ['PATIENT'] } },
            { from: 'account', to: 'account', name: 'Verify Password', description: 'So sánh password với BCrypt hash', log: 'BCrypt.verify() - password matched', data: { algorithm: 'BCrypt', cost: 10 } },
            { from: 'account', to: 'jwt', name: 'Generate Tokens', description: 'Tạo JWT access token (24h) và refresh token (7d)', log: 'JWT generated: exp=24h, alg=HS512', data: { accessExp: '24h', refreshExp: '7d' } },
            { from: 'jwt', to: 'client', name: 'Return Tokens', description: 'Trả về access_token và refresh_token', log: 'Response 200: tokens issued successfully', data: { status: 200 } }
        ]
    },

    'user-registration': {
        service: 'account',
        name: 'UC-001: User Registration',
        description: 'Register new user with email verification',
        nodes: [
            { id: 'client', name: 'Guest', icon: '👤', type: 'New User' },
            { id: 'account', name: 'Account Service', icon: '👤', type: 'Port 8081' },
            { id: 'validator', name: 'Validator', icon: '✅', type: 'Input Check' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'User DB' },
            { id: 'email', name: 'Email Service', icon: '📧', type: 'SMTP' }
        ],
        steps: [
            { from: 'client', to: 'account', name: 'Submit Registration', description: 'Gửi thông tin đăng ký: username, email, password', log: 'POST /api/auth/register', data: { fields: ['username', 'email', 'password'] } },
            { from: 'account', to: 'validator', name: 'Validate Input', description: 'Kiểm tra format email, độ mạnh password (min 8 chars)', log: 'Validation: email format OK, password strength OK', data: { minPassword: 8 } },
            { from: 'validator', to: 'db', name: 'Check Duplicate', description: 'Kiểm tra username/email đã tồn tại chưa', log: 'SELECT COUNT(*) FROM users WHERE email = ?', data: { check: 'unique constraint' } },
            { from: 'db', to: 'account', name: 'Confirm Available', description: 'Username và email chưa được sử dụng', log: 'No duplicate found - proceeding', data: { available: true } },
            { from: 'account', to: 'db', name: 'Create User', description: 'Tạo user mới với role PATIENT, hash password', log: 'INSERT INTO users - role=PATIENT', data: { defaultRole: 'PATIENT' } },
            { from: 'account', to: 'email', name: 'Send OTP', description: 'Gửi mã OTP 6 số qua email (valid 5 phút)', log: 'OTP sent to user@email.com', data: { otpLength: 6, validity: '5m' } },
            { from: 'email', to: 'client', name: 'Confirm Registration', description: 'Thông báo đăng ký thành công, chờ xác thực', log: 'Response 201: Registration successful', data: { status: 201 } }
        ]
    },

    'reset-password': {
        service: 'account',
        name: 'UC-004: Reset Password',
        description: 'Secure password reset with token validation',
        nodes: [
            { id: 'client', name: 'User', icon: '👤', type: 'Authenticated' },
            { id: 'account', name: 'Account Service', icon: '👤', type: 'Port 8081' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'User DB' },
            { id: 'email', name: 'Email Service', icon: '📧', type: 'SMTP' }
        ],
        steps: [
            { from: 'client', to: 'account', name: 'Request Reset', description: 'Yêu cầu reset password với email', log: 'POST /api/auth/forgot-password', data: {} },
            { from: 'account', to: 'db', name: 'Find User', description: 'Tìm user theo email', log: 'SELECT * FROM users WHERE email = ?', data: {} },
            { from: 'account', to: 'email', name: 'Send OTP', description: 'Gửi OTP reset password', log: 'OTP generated and sent', data: { validity: '5m' } },
            { from: 'client', to: 'account', name: 'Verify OTP', description: 'Xác thực mã OTP', log: 'OTP verified successfully', data: {} },
            { from: 'account', to: 'db', name: 'Update Password', description: 'Cập nhật password mới (BCrypt)', log: 'Password updated with BCrypt hash', data: {} },
            { from: 'db', to: 'client', name: 'Confirm Reset', description: 'Xác nhận đổi mật khẩu thành công', log: 'Response 200: Password reset complete', data: { status: 200 } }
        ]
    },

    // Clinic Service Workflows
    'view-clinics': {
        service: 'clinic',
        name: 'UC-023: View Clinic List',
        description: 'Browse clinics with search filters',
        nodes: [
            { id: 'client', name: 'User', icon: '👤', type: 'Any User' },
            { id: 'gateway', name: 'API Gateway', icon: '🌐', type: 'Spring Cloud' },
            { id: 'clinic', name: 'Clinic Service', icon: '🏥', type: 'Port 8082' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Clinic DB' },
            { id: 'cache', name: 'Redis', icon: '⚡', type: 'Cache' }
        ],
        steps: [
            { from: 'client', to: 'gateway', name: 'Request Clinics', description: 'Gửi request với filters (location, specialty)', log: 'GET /api/clinics?location=HCM', data: {} },
            { from: 'gateway', to: 'clinic', name: 'Route to Service', description: 'Định tuyến đến Clinic Service', log: 'Routing to clinic-service:8082', data: {} },
            { from: 'clinic', to: 'cache', name: 'Check Cache', description: 'Kiểm tra cache Redis', log: 'Cache MISS - fetching from DB', data: {} },
            { from: 'clinic', to: 'db', name: 'Query Clinics', description: 'Truy vấn danh sách phòng khám', log: 'SELECT * FROM clinics WHERE ...', data: {} },
            { from: 'db', to: 'cache', name: 'Update Cache', description: 'Lưu kết quả vào cache', log: 'Cache SET - TTL 5 minutes', data: { ttl: '5m' } },
            { from: 'cache', to: 'client', name: 'Return Results', description: 'Trả về danh sách phòng khám', log: 'Response 200: 15 clinics found', data: { count: 15 } }
        ]
    },

    'manage-rooms': {
        service: 'clinic',
        name: 'UC-026: Treatment Rooms',
        description: 'Manage treatment rooms with availability',
        nodes: [
            { id: 'admin', name: 'Admin', icon: '👨‍💼', type: 'ADMIN Role' },
            { id: 'clinic', name: 'Clinic Service', icon: '🏥', type: 'Port 8082' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Clinic DB' }
        ],
        steps: [
            { from: 'admin', to: 'clinic', name: 'Add Room Request', description: 'Tạo phòng khám mới với loại và thiết bị', log: 'POST /api/rooms - type=EXAMINATION', data: { types: ['EXAMINATION', 'SURGERY', 'X_RAY'] } },
            { from: 'clinic', to: 'clinic', name: 'Validate Room', description: 'Kiểm tra room number chưa tồn tại', log: 'Validation passed', data: {} },
            { from: 'clinic', to: 'db', name: 'Create Room', description: 'Lưu thông tin phòng vào database', log: 'INSERT INTO treatment_rooms', data: {} },
            { from: 'db', to: 'admin', name: 'Confirm Created', description: 'Xác nhận tạo phòng thành công', log: 'Response 201: Room RM-101 created', data: { roomId: 'RM-101' } }
        ]
    },

    // Appointment Service Workflows
    'book-appointment': {
        service: 'appointment',
        name: 'UC-048: Book Appointment',
        description: 'Complete appointment booking flow',
        nodes: [
            { id: 'patient', name: 'Patient', icon: '🧑‍🦰', type: 'PATIENT Role' },
            { id: 'appointment', name: 'Appointment', icon: '📅', type: 'Port 8083' },
            { id: 'schedule', name: 'Schedule', icon: '🗓️', type: 'Port 8085' },
            { id: 'payment', name: 'Payment', icon: '💳', type: 'VNPay/MoMo' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Appointment DB' },
            { id: 'notify', name: 'Notification', icon: '📧', type: 'Email/SMS' }
        ],
        steps: [
            { from: 'patient', to: 'appointment', name: 'Select Doctor/Time', description: 'Chọn bác sĩ và thời gian mong muốn', log: 'POST /api/appointments/book', data: { doctorId: 'DR-001', date: '2026-01-20' } },
            { from: 'appointment', to: 'schedule', name: 'Check Availability', description: 'Kiểm tra lịch trống của bác sĩ', log: 'GET /api/schedules/doctor/DR-001/slots', data: {} },
            { from: 'schedule', to: 'appointment', name: 'Confirm Slot', description: 'Xác nhận slot 09:00 còn trống', log: 'Slot available: 09:00-10:00', data: { slot: '09:00-10:00' } },
            { from: 'appointment', to: 'payment', name: 'Init Payment', description: 'Khởi tạo thanh toán qua VNPay', log: 'Payment URL generated', data: { gateway: 'VNPay' } },
            { from: 'payment', to: 'appointment', name: 'Payment Callback', description: 'Nhận callback thanh toán thành công', log: 'Payment verified: 500,000 VND', data: { amount: 500000 } },
            { from: 'appointment', to: 'db', name: 'Create Appointment', description: 'Tạo lịch hẹn trong database', log: 'INSERT INTO appointments - APT-12345', data: { appointmentId: 'APT-12345' } },
            { from: 'appointment', to: 'notify', name: 'Send Confirmation', description: 'Gửi email/SMS xác nhận', log: 'Confirmation sent via Email+SMS', data: {} },
            { from: 'notify', to: 'patient', name: 'Booking Complete', description: 'Hiển thị thông tin lịch hẹn', log: 'Response 201: Appointment created', data: { status: 201 } }
        ]
    },

    'cancel-appointment': {
        service: 'appointment',
        name: 'UC-055: Cancel Appointment',
        description: 'Cancel with refund processing',
        nodes: [
            { id: 'patient', name: 'Patient', icon: '🧑‍🦰', type: 'PATIENT' },
            { id: 'appointment', name: 'Appointment', icon: '📅', type: 'Port 8083' },
            { id: 'payment', name: 'Refund', icon: '💰', type: 'Gateway' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Appointment DB' }
        ],
        steps: [
            { from: 'patient', to: 'appointment', name: 'Request Cancel', description: 'Yêu cầu hủy lịch hẹn', log: 'DELETE /api/appointments/APT-12345', data: {} },
            { from: 'appointment', to: 'appointment', name: 'Check Policy', description: 'Kiểm tra chính sách hủy (>2h free)', log: 'Cancellation: 3h before - FREE', data: { refundRate: '100%' } },
            { from: 'appointment', to: 'payment', name: 'Process Refund', description: 'Hoàn tiền qua payment gateway', log: 'Refund initiated: 500,000 VND', data: {} },
            { from: 'appointment', to: 'db', name: 'Update Status', description: 'Cập nhật status = CANCELLED', log: 'UPDATE appointments SET status = CANCELLED', data: {} },
            { from: 'db', to: 'patient', name: 'Confirm Cancel', description: 'Xác nhận hủy thành công', log: 'Response 200: Cancelled, refund processing', data: {} }
        ]
    },

    // Patient Record Workflows
    'create-medical-record': {
        service: 'patient',
        name: 'UC-041: Create Medical Record',
        description: 'Initialize medical record with blockchain anchor',
        nodes: [
            { id: 'doctor', name: 'Doctor', icon: '👨‍⚕️', type: 'DOCTOR Role' },
            { id: 'patient-svc', name: 'Patient Service', icon: '📋', type: 'Port 8084' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Patient DB' },
            { id: 'blockchain', name: 'Blockchain', icon: '⛓️', type: 'Hyperledger' }
        ],
        steps: [
            { from: 'doctor', to: 'patient-svc', name: 'Start Record', description: 'Bắt đầu phiên khám mới', log: 'POST /api/medical-records', data: { patientId: 'PAT-001' } },
            { from: 'patient-svc', to: 'db', name: 'Create Draft', description: 'Tạo record với status DRAFT', log: 'INSERT INTO medical_records - DRAFT', data: { status: 'DRAFT' } },
            { from: 'doctor', to: 'patient-svc', name: 'Add Content', description: 'Thêm diagnosis, treatment notes', log: 'PUT /api/medical-records/{id}', data: {} },
            { from: 'patient-svc', to: 'db', name: 'Save Changes', description: 'Lưu nội dung record', log: 'UPDATE medical_records SET content = ?', data: {} },
            { from: 'doctor', to: 'patient-svc', name: 'Finalize Record', description: 'Hoàn tất và ký số', log: 'POST /api/medical-records/{id}/finalize', data: {} },
            { from: 'patient-svc', to: 'blockchain', name: 'Anchor Hash', description: 'Lưu SHA-256 hash lên blockchain', log: 'Chaincode: CreateRecord(hash)', data: { txId: 'tx_001' } },
            { from: 'blockchain', to: 'doctor', name: 'Confirm Anchored', description: 'Xác nhận record đã được anchor', log: 'Response 200: Record finalized on chain', data: {} }
        ]
    },

    'export-pdf': {
        service: 'patient',
        name: 'UC-047: Export to PDF',
        description: 'Generate PDF with blockchain verification',
        nodes: [
            { id: 'user', name: 'User', icon: '👤', type: 'Doctor/Patient' },
            { id: 'patient-svc', name: 'Patient Service', icon: '📋', type: 'Port 8084' },
            { id: 'blockchain', name: 'Blockchain', icon: '⛓️', type: 'Verify' },
            { id: 'pdf', name: 'PDF Generator', icon: '📄', type: 'iText' }
        ],
        steps: [
            { from: 'user', to: 'patient-svc', name: 'Request Export', description: 'Yêu cầu xuất PDF', log: 'GET /api/medical-records/{id}/export', data: {} },
            { from: 'patient-svc', to: 'blockchain', name: 'Verify Integrity', description: 'Xác minh hash trên blockchain', log: 'Chaincode: VerifyRecord(hash)', data: {} },
            { from: 'blockchain', to: 'patient-svc', name: 'Hash Verified', description: 'Xác nhận dữ liệu không bị thay đổi', log: 'Hash verification PASSED', data: { verified: true } },
            { from: 'patient-svc', to: 'pdf', name: 'Generate PDF', description: 'Tạo PDF với signature và QR code', log: 'Generating PDF with blockchain QR', data: {} },
            { from: 'pdf', to: 'user', name: 'Download PDF', description: 'Trả về file PDF', log: 'Response 200: PDF ready for download', data: {} }
        ]
    },

    // Schedule Service Workflows
    'create-shift': {
        service: 'schedule',
        name: 'UC-030: Create Work Shift',
        description: 'Define shift templates for doctors',
        nodes: [
            { id: 'admin', name: 'Admin', icon: '👨‍💼', type: 'ADMIN Role' },
            { id: 'schedule', name: 'Schedule Service', icon: '🗓️', type: 'Port 8085' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Schedule DB' }
        ],
        steps: [
            { from: 'admin', to: 'schedule', name: 'Create Template', description: 'Tạo shift template mới', log: 'POST /api/shifts/templates', data: { name: 'Morning', time: '08:00-12:00' } },
            { from: 'schedule', to: 'schedule', name: 'Validate Time', description: 'Kiểm tra không overlap với shift khác', log: 'No overlapping shifts found', data: {} },
            { from: 'schedule', to: 'db', name: 'Save Template', description: 'Lưu template vào database', log: 'INSERT INTO shift_templates', data: {} },
            { from: 'admin', to: 'schedule', name: 'Assign Doctor', description: 'Gán shift cho bác sĩ', log: 'POST /api/shifts/assign - DR-001', data: { doctorId: 'DR-001' } },
            { from: 'schedule', to: 'db', name: 'Create Assignment', description: 'Tạo lịch làm việc cho bác sĩ', log: 'INSERT INTO doctor_schedules', data: {} },
            { from: 'db', to: 'admin', name: 'Confirm Assigned', description: 'Xác nhận đã phân ca', log: 'Response 201: Shift assigned', data: {} }
        ]
    },

    'view-schedule': {
        service: 'schedule',
        name: 'UC-032: View Personal Schedule',
        description: 'Doctor views own schedule',
        nodes: [
            { id: 'doctor', name: 'Doctor', icon: '👨‍⚕️', type: 'DOCTOR' },
            { id: 'schedule', name: 'Schedule Service', icon: '🗓️', type: 'Port 8085' },
            { id: 'appointment', name: 'Appointment', icon: '📅', type: 'Port 8083' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Schedule DB' }
        ],
        steps: [
            { from: 'doctor', to: 'schedule', name: 'Request Schedule', description: 'Xem lịch tuần này', log: 'GET /api/schedules/me?week=current', data: {} },
            { from: 'schedule', to: 'db', name: 'Fetch Shifts', description: 'Lấy ca làm việc', log: 'SELECT * FROM doctor_schedules WHERE doctor_id = ?', data: {} },
            { from: 'schedule', to: 'appointment', name: 'Fetch Appointments', description: 'Lấy lịch hẹn trong ca', log: 'GET /api/appointments/doctor/{id}', data: {} },
            { from: 'appointment', to: 'schedule', name: 'Aggregate Data', description: 'Tổng hợp lịch và appointments', log: 'Merging schedule data', data: {} },
            { from: 'schedule', to: 'doctor', name: 'Return Calendar', description: 'Trả về lịch tổng hợp', log: 'Response 200: 15 shifts, 42 appointments', data: {} }
        ]
    },

    // Service Catalog Workflows
    'view-specialties': {
        service: 'services',
        name: 'UC-062: View Dental Specialties',
        description: 'Browse available dental specialties',
        nodes: [
            { id: 'user', name: 'User', icon: '👤', type: 'Any User' },
            { id: 'service-svc', name: 'Service Service', icon: '🦷', type: 'Port 8086' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Service DB' }
        ],
        steps: [
            { from: 'user', to: 'service-svc', name: 'Request Specialties', description: 'Lấy danh sách chuyên khoa', log: 'GET /api/specialties', data: {} },
            { from: 'service-svc', to: 'db', name: 'Query Specialties', description: 'Truy vấn danh sách', log: 'SELECT * FROM specialties WHERE active = true', data: {} },
            { from: 'db', to: 'user', name: 'Return List', description: 'Trả về 7 chuyên khoa', log: 'Response 200: Orthodontics, Endodontics, ...', data: { specialties: ['Orthodontics', 'Endodontics', 'Periodontics', 'Prosthodontics', 'Oral Surgery', 'Pediatric', 'Cosmetic'] } }
        ]
    },

    // Examination Service Workflows
    'clinical-examination': {
        service: 'examination',
        name: 'UC-066-078: Clinical Examination',
        description: 'Complete clinical workflow from symptoms to prescription',
        nodes: [
            { id: 'doctor', name: 'Doctor', icon: '👨‍⚕️', type: 'DOCTOR' },
            { id: 'exam', name: 'Examination', icon: '🩺', type: 'Port 8087' },
            { id: 'patient-svc', name: 'Patient Records', icon: '📋', type: 'Port 8084' },
            { id: 'imaging', name: 'Imaging', icon: '📷', type: 'Port 8088' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Exam DB' },
            { id: 'blockchain', name: 'Blockchain', icon: '⛓️', type: 'Anchor' }
        ],
        steps: [
            { from: 'doctor', to: 'patient-svc', name: 'Load Patient', description: 'Lấy thông tin bệnh nhân', log: 'GET /api/patients/PAT-001', data: {} },
            { from: 'doctor', to: 'exam', name: 'Input Symptoms', description: 'Nhập triệu chứng và vital signs', log: 'POST /api/examinations - chief complaint', data: { symptoms: 'Tooth pain', vitals: { bp: '120/80' } } },
            { from: 'exam', to: 'db', name: 'Save Symptoms', description: 'Lưu symptoms vào JSONB column', log: 'INSERT INTO symptoms - JSONB data', data: {} },
            { from: 'doctor', to: 'imaging', name: 'Order X-ray', description: 'Yêu cầu chụp X-ray răng số 36', log: 'POST /api/imaging/orders - Periapical #36', data: { toothNumber: 36, type: 'Periapical' } },
            { from: 'imaging', to: 'exam', name: 'X-ray Result', description: 'Nhận kết quả X-ray với AI analysis', log: 'Image uploaded, AI detected caries', data: { aiDetection: 'Caries' } },
            { from: 'doctor', to: 'exam', name: 'Add Diagnosis', description: 'Thêm mã ICD-10 chẩn đoán', log: 'POST /api/diagnoses - ICD-10: K02.1', data: { icd10: 'K02.1', name: 'Dental caries' } },
            { from: 'doctor', to: 'exam', name: 'Create Treatment Plan', description: 'Lập kế hoạch điều trị', log: 'POST /api/treatment-plans', data: { procedures: ['Filling', 'Crown'] } },
            { from: 'doctor', to: 'exam', name: 'Write Prescription', description: 'Kê đơn thuốc điện tử', log: 'POST /api/prescriptions - Amoxicillin 500mg', data: { medication: 'Amoxicillin', dosage: '500mg' } },
            { from: 'exam', to: 'blockchain', name: 'Anchor Record', description: 'Lưu hash lên blockchain', log: 'Chaincode: CreateRecord - signed by Doctor', data: { txId: 'tx_exam_001' } },
            { from: 'blockchain', to: 'doctor', name: 'Exam Complete', description: 'Hoàn tất phiên khám', log: 'Response 200: Examination completed', data: {} }
        ]
    },

    // Imaging Service Workflows
    'upload-image': {
        service: 'imaging',
        name: 'UC-079: Upload Dental Images',
        description: 'Upload with AI-powered analysis',
        nodes: [
            { id: 'doctor', name: 'Doctor', icon: '👨‍⚕️', type: 'DOCTOR' },
            { id: 'imaging', name: 'Imaging Service', icon: '📷', type: 'Port 8088' },
            { id: 's3', name: 'AWS S3', icon: '☁️', type: 'Storage' },
            { id: 'ai', name: 'AI Model', icon: '🤖', type: 'PyTorch' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Image DB' }
        ],
        steps: [
            { from: 'doctor', to: 'imaging', name: 'Upload Image', description: 'Tải lên ảnh X-ray/CBCT', log: 'POST /api/images - multipart/form-data', data: { maxSize: '50MB' } },
            { from: 'imaging', to: 's3', name: 'Store in S3', description: 'Lưu ảnh gốc vào S3 bucket', log: 'S3 upload: dental-images/2026/01/img_001.dcm', data: { bucket: 'dental-images' } },
            { from: 's3', to: 'imaging', name: 'Get S3 URL', description: 'Nhận URL của ảnh đã lưu', log: 'S3 URL generated with presigned access', data: {} },
            { from: 'imaging', to: 'ai', name: 'AI Analysis', description: 'Gửi ảnh qua AI phát hiện bệnh', log: 'Inference: EfficientNet-B0 model', data: { model: 'EfficientNet-B0' } },
            { from: 'ai', to: 'imaging', name: 'Detection Result', description: 'Nhận kết quả phát hiện', log: 'Detected: Caries (0.92), Gingivitis (0.78)', data: { predictions: [{ class: 'Caries', confidence: 0.92 }] } },
            { from: 'imaging', to: 'db', name: 'Save Metadata', description: 'Lưu metadata và AI annotations', log: 'INSERT INTO dental_images', data: {} },
            { from: 'db', to: 'doctor', name: 'Return Result', description: 'Trả về ảnh với AI annotations', log: 'Response 201: Image analyzed', data: {} }
        ]
    },

    'ai-annotate': {
        service: 'imaging',
        name: 'UC-083: AI Annotation',
        description: 'Auto-detect and annotate dental issues',
        nodes: [
            { id: 'image', name: 'X-ray Image', icon: '📷', type: 'DICOM/PNG' },
            { id: 'preprocess', name: 'Preprocess', icon: '🔄', type: 'Transform' },
            { id: 'model', name: 'AI Model', icon: '🤖', type: 'CNN' },
            { id: 'postprocess', name: 'Postprocess', icon: '📊', type: 'NMS' },
            { id: 'result', name: 'Annotations', icon: '🏷️', type: 'JSONB' }
        ],
        steps: [
            { from: 'image', to: 'preprocess', name: 'Load Image', description: 'Load và resize về 224x224', log: 'Image loaded: 1024x768 -> 224x224', data: {} },
            { from: 'preprocess', to: 'preprocess', name: 'Normalize', description: 'Normalize với ImageNet stats', log: 'Normalize: mean=[0.485,0.456,0.406]', data: {} },
            { from: 'preprocess', to: 'model', name: 'Inference', description: 'Pass qua EfficientNet backbone', log: 'Forward pass: torch.no_grad()', data: {} },
            { from: 'model', to: 'postprocess', name: 'Get Predictions', description: 'Softmax để lấy probabilities', log: 'Softmax: 6 class probabilities', data: { classes: 6 } },
            { from: 'postprocess', to: 'result', name: 'Generate Annotations', description: 'Tạo annotations với bbox và labels', log: 'Annotations: [{class: Caries, bbox: [...]}]', data: {} },
            { from: 'result', to: 'result', name: 'Save Annotations', description: 'Lưu annotations vào JSONB', log: 'Annotations saved to database', data: {} }
        ]
    },

    // Blockchain Service Workflows
    'create-ehr': {
        service: 'blockchain',
        name: 'Blockchain: Create EHR',
        description: 'Anchor medical record on Hyperledger Fabric',
        nodes: [
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'Gin' },
            { id: 'crypto', name: 'Encryption', icon: '🔐', type: 'AES-256' },
            { id: 'ipfs', name: 'IPFS', icon: '📦', type: 'Storage' },
            { id: 'fabric', name: 'Fabric', icon: '⛓️', type: 'Hyperledger' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Off-chain' }
        ],
        steps: [
            { from: 'api', to: 'api', name: 'Receive Request', description: 'Nhận yêu cầu tạo EHR', log: 'POST /v1/ehr - CreateEHR request', data: {} },
            { from: 'api', to: 'crypto', name: 'Encrypt Data', description: 'Mã hóa dữ liệu FHIR với AES-256-GCM', log: 'AES-256-GCM encryption complete', data: {} },
            { from: 'crypto', to: 'ipfs', name: 'Upload to IPFS', description: 'Lưu encrypted data lên IPFS', log: 'IPFS CID: Qm...abc123', data: {} },
            { from: 'api', to: 'api', name: 'Calculate Hash', description: 'Tính SHA-256 hash của data gốc', log: 'SHA-256: 0x7f83b1...', data: {} },
            { from: 'api', to: 'fabric', name: 'Invoke Chaincode', description: 'Gọi CreateRecord chaincode', log: 'Chaincode invoked: CreateRecord', data: {} },
            { from: 'fabric', to: 'fabric', name: 'Endorsement', description: '2 peers endorse transaction', log: 'Endorsed by peer0.org1, peer0.org2', data: {} },
            { from: 'fabric', to: 'fabric', name: 'Commit Block', description: 'Block #1234 committed to ledger', log: 'Block committed across all peers', data: { blockNumber: 1234 } },
            { from: 'api', to: 'db', name: 'Store Metadata', description: 'Lưu metadata vào PostgreSQL', log: 'Off-chain metadata saved', data: {} },
            { from: 'db', to: 'api', name: 'Return Success', description: 'Trả về recordId và txId', log: 'Response 201: EHR anchored on blockchain', data: { status: 201 } }
        ]
    },

    'verify-record': {
        service: 'blockchain',
        name: 'Blockchain: Verify Record',
        description: 'Verify medical record integrity',
        nodes: [
            { id: 'user', name: 'Auditor', icon: '👨‍💼', type: 'Verifier' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'Gin' },
            { id: 'fabric', name: 'Fabric', icon: '⛓️', type: 'Hyperledger' },
            { id: 'ipfs', name: 'IPFS', icon: '📦', type: 'Storage' }
        ],
        steps: [
            { from: 'user', to: 'api', name: 'Request Verify', description: 'Yêu cầu xác minh record', log: 'GET /v1/ehr/{id}/verify', data: {} },
            { from: 'api', to: 'fabric', name: 'Query Blockchain', description: 'Lấy hash đã lưu từ blockchain', log: 'Chaincode: QueryRecord(id)', data: {} },
            { from: 'fabric', to: 'api', name: 'Get Stored Hash', description: 'Nhận hash từ ledger', log: 'Hash on-chain: 0x7f83b1...', data: {} },
            { from: 'api', to: 'ipfs', name: 'Fetch Data', description: 'Lấy data từ IPFS', log: 'IPFS cat: fetching CID', data: {} },
            { from: 'ipfs', to: 'api', name: 'Decrypt & Hash', description: 'Decrypt và tính lại hash', log: 'Computed hash: 0x7f83b1...', data: {} },
            { from: 'api', to: 'api', name: 'Compare Hashes', description: 'So sánh 2 hash values', log: 'Hash match: VERIFIED ✅', data: { verified: true } },
            { from: 'api', to: 'user', name: 'Return Result', description: 'Trả về kết quả xác minh', log: 'Response 200: Record integrity verified', data: {} }
        ]
    },

    'consent-management': {
        service: 'blockchain',
        name: 'Blockchain: Consent',
        description: 'Patient consent for data sharing',
        nodes: [
            { id: 'patient', name: 'Patient', icon: '🧑‍🦰', type: 'Data Owner' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'Gin' },
            { id: 'fabric', name: 'Fabric', icon: '⛓️', type: 'Hyperledger' },
            { id: 'hospital', name: 'Hospital B', icon: '🏥', type: 'Recipient' }
        ],
        steps: [
            { from: 'patient', to: 'api', name: 'Grant Consent', description: 'Cấp quyền cho Hospital B', log: 'POST /v1/consent - target: Hospital-B', data: { scope: ['read', 'share'] } },
            { from: 'api', to: 'api', name: 'Create Consent', description: 'Tạo consent record với expiry', log: 'Consent created: 30-day validity', data: { expiresIn: '30d' } },
            { from: 'api', to: 'fabric', name: 'Store on Chain', description: 'Lưu consent lên blockchain', log: 'Chaincode: CreateConsent', data: {} },
            { from: 'fabric', to: 'fabric', name: 'Commit Consent', description: 'Consent committed to ledger', log: 'Consent CNS-001 on-chain', data: { consentId: 'CNS-001' } },
            { from: 'fabric', to: 'hospital', name: 'Notify Hospital', description: 'Event gửi đến Hospital B', log: 'Event: ConsentGranted emitted', data: {} },
            { from: 'api', to: 'patient', name: 'Confirm Consent', description: 'Xác nhận đã cấp quyền', log: 'Response 201: Consent granted', data: {} }
        ]
    }
};

// ========================================
// Workflow Simulator Class
// ========================================

class WorkflowSimulator {
    constructor() {
        this.currentService = 'account';
        this.currentWorkflow = null;
        this.currentStep = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 1;
        this.animationTimeout = null;
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadService(this.currentService);
    }

    bindElements() {
        this.elements = {
            diagram: document.getElementById('architecture-diagram'),
            flowContainer: document.getElementById('flow-container'),
            workflowList: document.getElementById('workflow-list'),
            workflowName: document.getElementById('workflow-name'),
            workflowDescription: document.getElementById('workflow-description'),
            metaService: document.getElementById('meta-service'),
            metaUsecase: document.getElementById('meta-usecase'),
            logContainer: document.getElementById('log-container'),
            progressFill: document.getElementById('progress-fill'),
            currentStep: document.getElementById('current-step'),
            totalSteps: document.getElementById('total-steps'),
            stepName: document.getElementById('step-name'),
            stepDescription: document.getElementById('step-description'),
            stepData: document.getElementById('step-data'),
            btnPlay: document.getElementById('btn-play'),
            btnPause: document.getElementById('btn-pause'),
            btnReset: document.getElementById('btn-reset'),
            speedSlider: document.getElementById('speed-slider'),
            speedValue: document.getElementById('speed-value')
        };
    }

    bindEvents() {
        document.querySelectorAll('.service-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isRunning) this.reset();
                document.querySelectorAll('.service-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadService(btn.dataset.service);
            });
        });

        this.elements.btnPlay.addEventListener('click', () => this.start());
        this.elements.btnPause.addEventListener('click', () => this.pause());
        this.elements.btnReset.addEventListener('click', () => this.reset());

        this.elements.speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            this.elements.speedValue.textContent = `${this.speed}x`;
        });
    }

    loadService(serviceId) {
        this.currentService = serviceId;
        const service = SERVICES[serviceId];

        // Filter workflows for this service
        const serviceWorkflows = Object.entries(WORKFLOWS)
            .filter(([, w]) => w.service === serviceId);

        // Render workflow list
        this.elements.workflowList.innerHTML = serviceWorkflows.map(([id, w]) => `
            <button class="workflow-item" data-workflow="${id}">
                ${w.name}
            </button>
        `).join('');

        // Bind workflow buttons
        this.elements.workflowList.querySelectorAll('.workflow-item').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isRunning) this.reset();
                this.elements.workflowList.querySelectorAll('.workflow-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadWorkflow(btn.dataset.workflow);
            });
        });

        // Auto-select first workflow
        if (serviceWorkflows.length > 0) {
            const firstBtn = this.elements.workflowList.querySelector('.workflow-item');
            if (firstBtn) {
                firstBtn.classList.add('active');
                this.loadWorkflow(serviceWorkflows[0][0]);
            }
        }

        this.clearLogs();
        this.addLog('info', `Selected service: ${service.name} (Port ${service.port})`);
    }

    loadWorkflow(workflowId) {
        this.currentWorkflow = workflowId;
        const workflow = WORKFLOWS[workflowId];
        const service = SERVICES[workflow.service];

        // Update header
        this.elements.workflowName.textContent = workflow.name;
        this.elements.workflowDescription.textContent = workflow.description;
        this.elements.metaService.querySelector('.value').textContent = service.name;
        this.elements.metaUsecase.querySelector('.value').textContent = workflowId;

        // Update progress
        this.elements.totalSteps.textContent = workflow.steps.length;
        this.elements.currentStep.textContent = '0';
        this.elements.progressFill.style.width = '0%';

        // Render diagram
        this.renderDiagram(workflow.nodes);

        // Enable play button
        this.elements.btnPlay.disabled = false;
        this.elements.btnReset.disabled = false;

        // Reset step detail
        this.elements.stepName.textContent = 'Ready';
        this.elements.stepDescription.textContent = 'Click Start to begin simulation';
        this.elements.stepData.classList.remove('visible');

        this.addLog('info', `Loaded workflow: ${workflow.name} (${workflow.steps.length} steps)`);
    }

    renderDiagram(nodes) {
        this.elements.diagram.innerHTML = '';
        nodes.forEach((node) => {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'node';
            nodeEl.id = `node-${node.id}`;
            nodeEl.innerHTML = `
                <div class="status-badge">✓</div>
                <div class="node-icon">${node.icon}</div>
                <div class="node-name">${node.name}</div>
                <div class="node-type">${node.type}</div>
            `;
            this.elements.diagram.appendChild(nodeEl);
        });
    }

    start() {
        if (this.isPaused) { this.resume(); return; }
        if (!this.currentWorkflow) return;

        this.isRunning = true;
        this.currentStep = 0;
        this.elements.btnPlay.disabled = true;
        this.elements.btnPause.disabled = false;
        this.addLog('success', 'Simulation started');
        this.runStep();
    }

    pause() {
        this.isPaused = true;
        this.elements.btnPlay.disabled = false;
        this.elements.btnPlay.innerHTML = '<span class="icon">▶</span> Resume';
        this.elements.btnPause.disabled = true;
        if (this.animationTimeout) clearTimeout(this.animationTimeout);
        this.addLog('warning', 'Simulation paused');
    }

    resume() {
        this.isPaused = false;
        this.elements.btnPlay.disabled = true;
        this.elements.btnPlay.innerHTML = '<span class="icon">▶</span> Start';
        this.elements.btnPause.disabled = false;
        this.addLog('info', 'Simulation resumed');
        this.runStep();
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentStep = 0;
        if (this.animationTimeout) clearTimeout(this.animationTimeout);

        this.elements.btnPlay.disabled = false;
        this.elements.btnPlay.innerHTML = '<span class="icon">▶</span> Start';
        this.elements.btnPause.disabled = true;
        this.elements.progressFill.style.width = '0%';
        this.elements.currentStep.textContent = '0';

        document.querySelectorAll('.node').forEach(n => n.classList.remove('active', 'completed', 'processing'));
        this.elements.flowContainer.innerHTML = '';

        this.elements.stepName.textContent = 'Ready';
        this.elements.stepDescription.textContent = 'Click Start to begin simulation';
        this.elements.stepData.classList.remove('visible');

        this.addLog('info', 'Simulation reset');
    }

    runStep() {
        const workflow = WORKFLOWS[this.currentWorkflow];
        if (this.currentStep >= workflow.steps.length) { this.complete(); return; }

        const step = workflow.steps[this.currentStep];

        // Update progress
        this.elements.currentStep.textContent = this.currentStep + 1;
        const progress = ((this.currentStep + 1) / workflow.steps.length) * 100;
        this.elements.progressFill.style.width = `${progress}%`;

        // Update step detail
        this.elements.stepName.textContent = step.name;
        this.elements.stepDescription.textContent = step.description;
        if (step.data && Object.keys(step.data).length > 0) {
            this.elements.stepData.textContent = JSON.stringify(step.data, null, 2);
            this.elements.stepData.classList.add('visible');
        } else {
            this.elements.stepData.classList.remove('visible');
        }

        // Add log
        this.addLog('info', step.log);

        // Animate nodes
        this.animateStep(step);

        // Schedule next step
        const delay = 1800 / this.speed;
        this.animationTimeout = setTimeout(() => {
            this.currentStep++;
            this.runStep();
        }, delay);
    }

    animateStep(step) {
        const fromNode = document.getElementById(`node-${step.from}`);
        const toNode = document.getElementById(`node-${step.to}`);
        if (!fromNode || !toNode) return;

        document.querySelectorAll('.node').forEach(n => n.classList.remove('active', 'processing'));
        fromNode.classList.add('completed');
        toNode.classList.add('active', 'processing');

        if (step.from !== step.to) this.animateParticle(fromNode, toNode);
    }

    animateParticle(fromNode, toNode) {
        const particle = document.createElement('div');
        particle.className = 'data-particle';
        this.elements.flowContainer.appendChild(particle);

        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();
        const containerRect = this.elements.flowContainer.getBoundingClientRect();

        const startX = fromRect.left + fromRect.width / 2 - containerRect.left;
        const startY = fromRect.top + fromRect.height / 2 - containerRect.top;
        const endX = toRect.left + toRect.width / 2 - containerRect.left;
        const endY = toRect.top + toRect.height / 2 - containerRect.top;

        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;

        const duration = 700 / this.speed;
        particle.animate([
            { left: `${startX}px`, top: `${startY}px`, opacity: 1, transform: 'scale(1)' },
            { left: `${endX}px`, top: `${endY}px`, opacity: 1, transform: 'scale(1.3)' }
        ], { duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' })
        .onfinish = () => particle.remove();
    }

    complete() {
        this.isRunning = false;
        this.elements.btnPlay.disabled = false;
        this.elements.btnPlay.innerHTML = '<span class="icon">▶</span> Start';
        this.elements.btnPause.disabled = true;

        document.querySelectorAll('.node').forEach(n => {
            n.classList.remove('active', 'processing');
            n.classList.add('completed');
        });

        this.elements.stepName.textContent = '✅ Completed';
        this.elements.stepDescription.textContent = 'Workflow simulation finished successfully!';
        this.addLog('success', '✅ Workflow completed successfully!');
    }

    addLog(type, message) {
        const time = new Date().toLocaleTimeString('vi-VN');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `<span class="log-time">${time}</span><span class="log-message">${message}</span>`;
        this.elements.logContainer.appendChild(logEntry);
        this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
    }

    clearLogs() {
        this.elements.logContainer.innerHTML = '';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.simulator = new WorkflowSimulator();
});
