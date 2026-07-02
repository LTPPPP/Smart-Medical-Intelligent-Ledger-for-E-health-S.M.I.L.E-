/**
 * S.M.I.L.E User Journey Screenplay Simulation
 * Interactive demo of user interactions with the dental healthcare platform
 */

// ========================================
// Journey Definitions
// ========================================

const JOURNEYS = {
    registration: {
        name: 'Registration & Login',
        description: 'Luồng đăng ký tài khoản và đăng nhập hệ thống',
        useCases: 'UC-001, UC-002, UC-008',
        steps: [
            { actor: 'guest', icon: '👤', action: 'Mở trang đăng ký', description: 'Guest truy cập trang registration', ui: 'form-empty' },
            { actor: 'guest', icon: '👤', action: 'Nhập thông tin đăng ký', description: 'Điền email, username, phone, password', ui: 'form-filling' },
            { actor: 'system', icon: '⚙️', action: 'Validate dữ liệu', description: 'Kiểm tra email/username/phone unique', ui: 'form-validating' },
            { actor: 'system', icon: '📧', action: 'Gửi OTP qua email', description: 'OTP 6 số, hiệu lực 5 phút', ui: 'otp-sent' },
            { actor: 'guest', icon: '👤', action: 'Nhập mã OTP', description: 'Xác thực email', ui: 'otp-input' },
            { actor: 'system', icon: '✅', action: 'Kích hoạt tài khoản', description: 'Gán role PATIENT, status ACTIVE', ui: 'account-activated' },
            { actor: 'patient', icon: '🧑‍⚕️', action: 'Đăng nhập hệ thống', description: 'Nhập email/password', ui: 'login-form' },
            { actor: 'system', icon: '🔐', action: 'Xác thực BCrypt', description: 'So sánh password hash', ui: 'auth-checking' },
            { actor: 'system', icon: '🎫', action: 'Phát hành JWT Token', description: 'Access (24h) + Refresh (7 days)', ui: 'token-issued' },
            { actor: 'patient', icon: '🧑‍⚕️', action: 'Vào Dashboard', description: 'Hiển thị giao diện Patient', ui: 'dashboard' }
        ]
    },
    profile: {
        name: 'Patient Profile',
        description: 'Tạo và quản lý hồ sơ bệnh nhân',
        useCases: 'UC-037, UC-038, UC-039, UC-040',
        steps: [
            { actor: 'receptionist', icon: '👩‍💼', action: 'Mở form tạo bệnh nhân', description: 'Truy cập Patient Registration', ui: 'patient-form-empty' },
            { actor: 'receptionist', icon: '👩‍💼', action: 'Nhập thông tin cá nhân', description: 'Họ tên, ngày sinh, CCCD, SĐT', ui: 'patient-form-personal' },
            { actor: 'receptionist', icon: '👩‍💼', action: 'Nhập thông tin bảo hiểm', description: 'Số thẻ BHYT, công ty bảo hiểm', ui: 'patient-form-insurance' },
            { actor: 'system', icon: '⚙️', action: 'Tạo mã bệnh nhân', description: 'Format: P-YYYYMMDD-XXXX', ui: 'patient-code-generated' },
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Thêm tiền sử bệnh', description: 'Dị ứng, bệnh mãn tính, thuốc đang dùng', ui: 'medical-history-form' },
            { actor: 'system', icon: '💾', action: 'Lưu JSONB format', description: 'Flexible schema cho condition details', ui: 'save-success' },
            { actor: 'patient', icon: '🧑‍⚕️', action: 'Xem hồ sơ cá nhân', description: 'Limited access - không thấy clinical data', ui: 'patient-view-profile' }
        ]
    },
    booking: {
        name: 'AI Booking',
        description: 'Đặt lịch hẹn qua AI Chatbot với NLP',
        useCases: 'UC-048, UC-049, UC-050, UC-056',
        steps: [
            { actor: 'patient', icon: '🧑‍⚕️', action: 'Mở chatbot', description: '"Xin chào! Tôi muốn đặt lịch khám"', ui: 'chat-start' },
            { actor: 'ai', icon: '🤖', action: 'Intent Classification', description: 'Detect: book_appointment (confidence: 0.95)', ui: 'chat-intent' },
            { actor: 'ai', icon: '🤖', action: 'Entity Extraction', description: 'Extract: date, time, specialty từ text', ui: 'chat-entity' },
            { actor: 'ai', icon: '🧠', action: 'Query Gemini LLM', description: 'Natural language understanding', ui: 'chat-llm' },
            { actor: 'system', icon: '📅', action: 'Kiểm tra lịch trống', description: 'Gọi Schedule Service API', ui: 'chat-check-schedule' },
            { actor: 'ai', icon: '🤖', action: 'Gợi ý slot khả dụng', description: '"BS. Nguyễn có lịch 9:00 AM ngày mai"', ui: 'chat-suggest' },
            { actor: 'patient', icon: '🧑‍⚕️', action: 'Xác nhận lịch hẹn', description: '"Vâng, tôi chọn lịch đó"', ui: 'chat-confirm' },
            { actor: 'system', icon: '✅', action: 'Tạo appointment', description: 'Status: SCHEDULED', ui: 'appointment-created' },
            { actor: 'system', icon: '📧', action: 'Gửi thông báo', description: 'Email + SMS confirmation', ui: 'notification-sent' },
            { actor: 'system', icon: '⏰', action: 'Schedule reminders', description: '24h + 1h trước lịch hẹn', ui: 'reminders-scheduled' }
        ]
    },
    schedule: {
        name: 'Schedule Management',
        description: 'Quản lý lịch làm việc bác sĩ',
        useCases: 'UC-030, UC-031, UC-032, UC-034, UC-036',
        steps: [
            { actor: 'admin', icon: '👔', action: 'Tạo shift templates', description: 'Morning, Afternoon, Evening, Night', ui: 'shift-templates' },
            { actor: 'admin', icon: '👔', action: 'Phân ca cho bác sĩ', description: 'Gán shift + date range', ui: 'assign-shifts' },
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Xem lịch cá nhân', description: 'Calendar view: Daily/Weekly/Monthly', ui: 'doctor-calendar' },
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Yêu cầu đổi lịch', description: 'Submit change request', ui: 'change-request' },
            { actor: 'system', icon: '⚙️', action: 'Phát hiện xung đột', description: 'Check overlapping shifts', ui: 'conflict-check' },
            { actor: 'admin', icon: '👔', action: 'Duyệt yêu cầu', description: 'Approve/Reject với lý do', ui: 'approve-request' },
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Yêu cầu đổi ca', description: 'Chọn đồng nghiệp để swap', ui: 'swap-request' },
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Đồng nghiệp chấp nhận', description: 'Peer approval', ui: 'peer-accept' },
            { actor: 'admin', icon: '👔', action: 'Duyệt cuối cùng', description: 'Final approval', ui: 'final-approve' },
            { actor: 'system', icon: '📧', action: 'Thông báo bệnh nhân', description: 'Email nếu ảnh hưởng lịch hẹn', ui: 'notify-patients' }
        ]
    },
    medical: {
        name: 'Medical Record',
        description: 'Hồ sơ y tế điện tử của bệnh nhân',
        useCases: 'UC-041, UC-042, UC-044, UC-047',
        steps: [
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Tạo medical record', description: 'Status: DRAFT', ui: 'record-create' },
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Nhập triệu chứng', description: 'Chief complaint, vital signs (JSONB)', ui: 'input-symptoms' },
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Chẩn đoán ICD-10', description: 'Code: K02.1 (Dental caries)', ui: 'add-diagnosis' },
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Tạo treatment plan', description: 'Multiple phases, cost estimates', ui: 'treatment-plan' },
            { actor: 'patient', icon: '🧑‍⚕️', action: 'Phê duyệt điều trị', description: 'Digital signature consent', ui: 'patient-consent' },
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Ghi nhận điều trị', description: 'FDI tooth numbering (11-48)', ui: 'record-treatment' },
            { actor: 'doctor', icon: '👨‍⚕️', action: 'Finalize record', description: 'Status: FINALIZED (immutable)', ui: 'finalize-record' },
            { actor: 'patient', icon: '🧑‍⚕️', action: 'Export PDF', description: 'Xuất hồ sơ y tế ra file PDF', ui: 'export-pdf' }
        ]
    },
    payment: {
        name: 'Payment Processing',
        description: 'Thanh toán qua VNPay/MoMo/ZaloPay',
        useCases: 'UC-059, UC-060, UC-055',
        steps: [
            { actor: 'patient', icon: '🧑‍⚕️', action: 'Khởi tạo thanh toán', description: 'Xem tổng tiền cần thanh toán', ui: 'payment-init' },
            { actor: 'system', icon: '⚙️', action: 'Tính tổng tiền', description: 'Service fees + tax + discount', ui: 'calculate-total' },
            { actor: 'patient', icon: '🧑‍⚕️', action: 'Chọn phương thức', description: 'VNPay / MoMo / ZaloPay', ui: 'select-method' },
            { actor: 'system', icon: '🔗', action: 'Tạo payment URL', description: 'Generate gateway redirect', ui: 'generate-url' },
            { actor: 'gateway', icon: '🏦', action: 'Redirect to gateway', description: 'VNPay secure payment page', ui: 'gateway-redirect' },
            { actor: 'patient', icon: '🧑‍⚕️', action: 'Nhập thông tin thẻ', description: 'Card details / E-wallet', ui: 'enter-card' },
            { actor: 'gateway', icon: '🏦', action: 'Xử lý giao dịch', description: 'Signature verification', ui: 'process-payment' },
            { actor: 'system', icon: '📥', action: 'Nhận callback webhook', description: 'Amount matching, txn ID check', ui: 'receive-callback' },
            { actor: 'system', icon: '✅', action: 'Cập nhật trạng thái', description: 'Status: PAID, generate receipt', ui: 'update-status' },
            { actor: 'system', icon: '📧', action: 'Gửi xác nhận', description: 'Email receipt + appointment details', ui: 'send-confirmation' }
        ]
    }
};

// ========================================
// State Management
// ========================================

let state = {
    currentJourney: 'registration',
    currentStep: 0,
    isPlaying: false,
    isPaused: false,
    speed: 1,
    intervalId: null
};

// ========================================
// DOM Elements
// ========================================

const elements = {
    journeyBtns: document.querySelectorAll('.journey-btn'),
    journeyName: document.getElementById('journey-name'),
    journeyDescription: document.getElementById('journey-description'),
    metaUsecases: document.getElementById('meta-usecases'),
    mockUiContainer: document.getElementById('mock-ui-container'),
    timeline: document.getElementById('timeline'),
    btnPlay: document.getElementById('btn-play'),
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset'),
    speedSlider: document.getElementById('speed-slider'),
    speedValue: document.getElementById('speed-value'),
    progressFill: document.getElementById('progress-fill'),
    currentStepEl: document.getElementById('current-step'),
    totalStepsEl: document.getElementById('total-steps'),
    stepActor: document.getElementById('step-actor'),
    stepName: document.getElementById('step-name'),
    stepDescription: document.getElementById('step-description'),
    logContainer: document.getElementById('log-container')
};

// ========================================
// Initialize
// ========================================

function init() {
    setupEventListeners();
    selectJourney('registration');
}

function setupEventListeners() {
    elements.journeyBtns.forEach(btn => {
        btn.addEventListener('click', () => selectJourney(btn.dataset.journey));
    });
    
    elements.btnPlay.addEventListener('click', startSimulation);
    elements.btnPause.addEventListener('click', pauseSimulation);
    elements.btnReset.addEventListener('click', resetSimulation);
    
    elements.speedSlider.addEventListener('input', (e) => {
        state.speed = parseFloat(e.target.value);
        elements.speedValue.textContent = state.speed + 'x';
    });
}

// ========================================
// Journey Selection
// ========================================

function selectJourney(journeyId) {
    state.currentJourney = journeyId;
    state.currentStep = 0;
    state.isPlaying = false;
    
    // Update active button
    elements.journeyBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.journey === journeyId);
    });
    
    const journey = JOURNEYS[journeyId];
    
    // Update header
    elements.journeyName.textContent = journey.name;
    elements.journeyDescription.textContent = journey.description;
    elements.metaUsecases.textContent = journey.useCases;
    
    // Render timeline
    renderTimeline(journey);
    
    // Update progress
    elements.totalStepsEl.textContent = journey.steps.length;
    elements.currentStepEl.textContent = '0';
    elements.progressFill.style.width = '0%';
    
    // Reset UI
    renderEmptyState();
    updateStepDetail(null);
    
    // Enable play button
    elements.btnPlay.disabled = false;
    elements.btnPause.disabled = true;
    elements.btnReset.disabled = true;
    
    addLog('info', `Selected journey: ${journey.name}`);
}

function renderTimeline(journey) {
    elements.timeline.innerHTML = journey.steps.map((step, index) => `
        <div class="timeline-step" data-index="${index}">
            <div class="timeline-dot">${index + 1}</div>
            <div class="timeline-label">${step.action.substring(0, 15)}...</div>
        </div>
    `).join('');
}

// ========================================
// Simulation Control
// ========================================

function startSimulation() {
    const journey = JOURNEYS[state.currentJourney];
    
    if (state.currentStep >= journey.steps.length) {
        state.currentStep = 0;
    }
    
    state.isPlaying = true;
    state.isPaused = false;
    
    elements.btnPlay.disabled = true;
    elements.btnPause.disabled = false;
    elements.btnReset.disabled = false;
    
    addLog('success', 'Simulation started');
    runStep();
}

function pauseSimulation() {
    state.isPaused = true;
    state.isPlaying = false;
    
    if (state.intervalId) {
        clearTimeout(state.intervalId);
        state.intervalId = null;
    }
    
    elements.btnPlay.disabled = false;
    elements.btnPause.disabled = true;
    
    addLog('warning', 'Simulation paused');
}

function resetSimulation() {
    state.currentStep = 0;
    state.isPlaying = false;
    state.isPaused = false;
    
    if (state.intervalId) {
        clearTimeout(state.intervalId);
        state.intervalId = null;
    }
    
    // Reset timeline
    document.querySelectorAll('.timeline-step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    // Reset progress
    elements.progressFill.style.width = '0%';
    elements.currentStepEl.textContent = '0';
    
    // Reset UI
    renderEmptyState();
    updateStepDetail(null);
    
    elements.btnPlay.disabled = false;
    elements.btnPause.disabled = true;
    elements.btnReset.disabled = true;
    
    addLog('info', 'Simulation reset');
}

function runStep() {
    const journey = JOURNEYS[state.currentJourney];
    
    if (state.currentStep >= journey.steps.length) {
        completeSimulation();
        return;
    }
    
    const step = journey.steps[state.currentStep];
    
    // Update timeline
    document.querySelectorAll('.timeline-step').forEach((el, idx) => {
        el.classList.remove('active', 'completed');
        if (idx < state.currentStep) el.classList.add('completed');
        if (idx === state.currentStep) el.classList.add('active');
    });
    
    // Update progress
    const progress = ((state.currentStep + 1) / journey.steps.length) * 100;
    elements.progressFill.style.width = progress + '%';
    elements.currentStepEl.textContent = state.currentStep + 1;
    
    // Update step detail
    updateStepDetail(step);
    
    // Render mock UI
    renderMockUI(step);
    
    // Add log
    addLog('success', `[${step.actor.toUpperCase()}] ${step.action}`);
    
    // Schedule next step
    state.currentStep++;
    const delay = 2000 / state.speed;
    
    if (state.isPlaying && !state.isPaused) {
        state.intervalId = setTimeout(runStep, delay);
    }
}

function completeSimulation() {
    state.isPlaying = false;
    
    // Mark all as completed
    document.querySelectorAll('.timeline-step').forEach(el => {
        el.classList.remove('active');
        el.classList.add('completed');
    });
    
    elements.btnPlay.disabled = false;
    elements.btnPause.disabled = true;
    
    addLog('success', '✅ Simulation completed!');
    renderSuccessScreen();
}

// ========================================
// Step Detail Update
// ========================================

function updateStepDetail(step) {
    if (!step) {
        elements.stepActor.innerHTML = `<span class="actor-icon">👤</span><span class="actor-name">Ready</span>`;
        elements.stepActor.dataset.actor = 'guest';
        elements.stepName.textContent = 'Ready';
        elements.stepDescription.textContent = 'Chọn một journey và nhấn Start';
        return;
    }
    
    elements.stepActor.innerHTML = `<span class="actor-icon">${step.icon}</span><span class="actor-name">${step.actor}</span>`;
    elements.stepActor.dataset.actor = step.actor;
    elements.stepName.textContent = step.action;
    elements.stepDescription.textContent = step.description;
}

// ========================================
// Mock UI Rendering
// ========================================

function renderEmptyState() {
    elements.mockUiContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🎬</div>
            <p>Nhấn <strong>Start</strong> để bắt đầu mô phỏng</p>
        </div>
    `;
}

function renderMockUI(step) {
    const ui = step.ui;
    let html = '';
    
    // Registration Journey UIs
    if (ui === 'form-empty' || ui === 'form-filling' || ui === 'form-validating') {
        html = renderRegistrationForm(ui);
    } else if (ui.startsWith('otp')) {
        html = renderOTPScreen(ui);
    } else if (ui === 'account-activated' || ui === 'save-success') {
        html = renderSuccessMessage('Thành công!', 'Tài khoản đã được kích hoạt');
    } else if (ui === 'login-form' || ui === 'auth-checking') {
        html = renderLoginForm(ui);
    } else if (ui === 'token-issued') {
        html = renderTokenScreen();
    } else if (ui === 'dashboard') {
        html = renderDashboard();
    }
    // AI Booking UIs
    else if (ui.startsWith('chat')) {
        html = renderChatUI(ui, step);
    } else if (ui === 'appointment-created' || ui === 'notification-sent' || ui === 'reminders-scheduled') {
        html = renderSuccessMessage('Đặt lịch thành công!', step.description);
    }
    // Medical Record UIs
    else if (ui.startsWith('record') || ui.startsWith('input') || ui.startsWith('add') || ui.startsWith('treatment') || ui.startsWith('patient-consent') || ui.startsWith('finalize')) {
        html = renderMedicalRecordUI(ui, step);
    } else if (ui === 'export-pdf') {
        html = renderSuccessMessage('📄 PDF Exported', 'Hồ sơ y tế đã được xuất ra file PDF');
    }
    // Payment UIs
    else if (ui.startsWith('payment') || ui.startsWith('calculate') || ui.startsWith('select-method') || ui.startsWith('generate') || ui.startsWith('gateway') || ui.startsWith('enter') || ui.startsWith('process') || ui.startsWith('receive') || ui.startsWith('update') || ui.startsWith('send')) {
        html = renderPaymentUI(ui, step);
    }
    // Default
    else {
        html = renderGenericStep(step);
    }
    
    elements.mockUiContainer.innerHTML = `<div class="mock-screen">${html}</div>`;
}

function renderRegistrationForm(ui) {
    const filled = ui !== 'form-empty';
    const validating = ui === 'form-validating';
    
    return `
        <div class="mock-form">
            <div class="mock-form-title">📝 Đăng Ký Tài Khoản</div>
            <div class="mock-input-group">
                <label>Họ và tên</label>
                <input type="text" class="mock-input ${filled ? 'filled' : ''}" value="${filled ? 'Nguyễn Văn A' : ''}" readonly>
            </div>
            <div class="mock-input-group">
                <label>Email</label>
                <input type="email" class="mock-input ${filled ? 'filled' : ''}" value="${filled ? 'nguyenvana@gmail.com' : ''}" readonly>
            </div>
            <div class="mock-input-group">
                <label>Số điện thoại</label>
                <input type="tel" class="mock-input ${filled ? 'filled' : ''}" value="${filled ? '0901234567' : ''}" readonly>
            </div>
            <div class="mock-input-group">
                <label>Mật khẩu</label>
                <input type="password" class="mock-input ${filled ? 'filled' : ''}" value="${filled ? '********' : ''}" readonly>
            </div>
            <button class="mock-btn ${validating ? 'loading' : ''}">${validating ? 'Đang xử lý' : 'Đăng Ký'}</button>
        </div>
    `;
}

function renderOTPScreen(ui) {
    const filled = ui === 'otp-input';
    return `
        <div class="mock-form mock-otp">
            <div class="otp-icon">📧</div>
            <div class="otp-title">Xác Thực Email</div>
            <div class="otp-subtitle">Nhập mã OTP đã gửi đến email của bạn</div>
            <div class="otp-inputs">
                ${[1,2,3,4,5,6].map((n, i) => `<input class="otp-input ${filled && i < 6 ? 'filled' : ''}" value="${filled ? n : ''}" readonly>`).join('')}
            </div>
            <button class="mock-btn ${filled ? 'loading' : ''}">Xác Nhận</button>
        </div>
    `;
}

function renderLoginForm(ui) {
    const checking = ui === 'auth-checking';
    return `
        <div class="mock-form">
            <div class="mock-form-title">🔐 Đăng Nhập</div>
            <div class="mock-input-group">
                <label>Email / Username</label>
                <input type="text" class="mock-input filled" value="nguyenvana@gmail.com" readonly>
            </div>
            <div class="mock-input-group">
                <label>Mật khẩu</label>
                <input type="password" class="mock-input filled" value="********" readonly>
            </div>
            <button class="mock-btn ${checking ? 'loading' : ''}">${checking ? 'Đang xác thực...' : 'Đăng Nhập'}</button>
        </div>
    `;
}

function renderTokenScreen() {
    return `
        <div class="mock-form">
            <div class="mock-form-title">🎫 JWT Token Issued</div>
            <div style="background: var(--bg-card); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">Access Token (24h)</div>
                <div style="font-family: monospace; font-size: 0.65rem; color: var(--success); word-break: break-all;">eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lk...</div>
            </div>
            <div style="background: var(--bg-card); padding: 1rem; border-radius: 8px;">
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">Refresh Token (7 days)</div>
                <div style="font-family: monospace; font-size: 0.65rem; color: var(--info); word-break: break-all;">dGhpc19pc19hX3JlZnJlc2hfdG9rZW4...</div>
            </div>
        </div>
    `;
}

function renderDashboard() {
    return `
        <div class="mock-dashboard">
            <div class="dashboard-header">
                <div class="dashboard-user">
                    <div class="user-avatar">👤</div>
                    <div>
                        <div style="font-weight: 600;">Nguyễn Văn A</div>
                        <div style="font-size: 0.75rem; color: var(--success);">● Patient</div>
                    </div>
                </div>
                <span style="padding: 0.25rem 0.75rem; background: var(--accent-gradient); border-radius: 20px; font-size: 0.75rem;">Logged In</span>
            </div>
            <div class="dashboard-content">
                <div class="dashboard-cards">
                    <div class="dashboard-card">
                        <div class="card-icon">📅</div>
                        <div class="card-value">2</div>
                        <div class="card-label">Appointments</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-icon">📋</div>
                        <div class="card-value">5</div>
                        <div class="card-label">Records</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-icon">💊</div>
                        <div class="card-value">3</div>
                        <div class="card-label">Prescriptions</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderChatUI(ui, step) {
    const messages = [];
    
    if (ui === 'chat-start') {
        messages.push({ type: 'user', text: 'Xin chào! Tôi muốn đặt lịch khám răng' });
    } else if (ui === 'chat-intent') {
        messages.push({ type: 'user', text: 'Xin chào! Tôi muốn đặt lịch khám răng' });
        messages.push({ type: 'system', text: '🎯 Intent: book_appointment (95%)' });
    } else if (ui === 'chat-entity') {
        messages.push({ type: 'user', text: 'Tôi muốn khám răng sáng mai lúc 9 giờ' });
        messages.push({ type: 'system', text: '📦 Entities: date=tomorrow, time=09:00, specialty=general' });
    } else if (ui === 'chat-llm' || ui === 'chat-check-schedule') {
        messages.push({ type: 'user', text: 'Tôi muốn khám răng sáng mai lúc 9 giờ' });
        messages.push({ type: 'ai', text: '🔄 Đang kiểm tra lịch trống...' });
    } else if (ui === 'chat-suggest') {
        messages.push({ type: 'user', text: 'Tôi muốn khám răng sáng mai lúc 9 giờ' });
        messages.push({ type: 'ai', text: 'Tôi tìm thấy các slot khả dụng:\n\n• BS. Nguyễn Văn B - 9:00 AM\n• BS. Trần Thị C - 10:00 AM\n\nBạn muốn chọn lịch nào?' });
    } else if (ui === 'chat-confirm') {
        messages.push({ type: 'ai', text: 'BS. Nguyễn Văn B - 9:00 AM ngày mai. Xác nhận?' });
        messages.push({ type: 'user', text: 'Vâng, tôi xác nhận lịch hẹn' });
        messages.push({ type: 'ai', text: '✅ Đã đặt lịch thành công! Mã hẹn: APT-20260115-001' });
    }
    
    return `
        <div class="mock-chat">
            <div class="chat-header">
                <div class="chat-avatar">🤖</div>
                <div class="chat-info">
                    <h4>S.M.I.L.E Assistant</h4>
                    <span>● Online</span>
                </div>
            </div>
            <div class="chat-messages">
                ${messages.map(m => `<div class="chat-bubble ${m.type}">${m.text}</div>`).join('')}
            </div>
            <div class="chat-input-area">
                <input type="text" placeholder="Nhập tin nhắn..." readonly>
                <button>Gửi</button>
            </div>
        </div>
    `;
}

function renderMedicalRecordUI(ui, step) {
    return `
        <div class="mock-form">
            <div class="mock-form-title">📋 ${step.action}</div>
            <div style="padding: 1rem; background: var(--bg-card); border-radius: 8px; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-muted);">Record ID</span>
                    <span style="color: var(--accent-primary); font-family: monospace;">MR-20260115-001</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Status</span>
                    <span style="color: ${ui.includes('finalize') ? 'var(--success)' : 'var(--warning)'};">${ui.includes('finalize') ? 'FINALIZED' : 'DRAFT'}</span>
                </div>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">${step.description}</p>
        </div>
    `;
}

function renderPaymentUI(ui, step) {
    if (ui === 'payment-init' || ui === 'calculate-total') {
        return `
            <div class="mock-payment">
                <div class="payment-header">
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">Tổng thanh toán</div>
                    <div class="payment-amount">1,500,000₫</div>
                </div>
                <div class="payment-methods" style="text-align: center; padding: 2rem;">
                    <p style="color: var(--text-muted);">Đang tính toán...</p>
                </div>
            </div>
        `;
    }
    
    if (ui === 'select-method') {
        return `
            <div class="mock-payment">
                <div class="payment-header">
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">Tổng thanh toán</div>
                    <div class="payment-amount">1,500,000₫</div>
                </div>
                <div class="payment-methods">
                    <div class="payment-method selected">
                        <div class="payment-method-logo">💳</div>
                        <div>
                            <div style="font-weight: 600;">VNPay</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Thẻ ATM / Visa / Master</div>
                        </div>
                    </div>
                    <div class="payment-method">
                        <div class="payment-method-logo">📱</div>
                        <div>
                            <div style="font-weight: 600;">MoMo</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Ví điện tử MoMo</div>
                        </div>
                    </div>
                    <div class="payment-method">
                        <div class="payment-method-logo">💰</div>
                        <div>
                            <div style="font-weight: 600;">ZaloPay</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Ví ZaloPay</div>
                        </div>
                    </div>
                </div>
                <div class="payment-footer">
                    <button class="mock-btn">Thanh Toán</button>
                </div>
            </div>
        `;
    }
    
    // Default payment processing
    return renderSuccessMessage('💳 ' + step.action, step.description);
}

function renderSuccessMessage(title, message) {
    return `
        <div class="mock-success">
            <div class="success-icon">✅</div>
            <div class="success-title">${title}</div>
            <div class="success-message">${message}</div>
        </div>
    `;
}

function renderSuccessScreen() {
    elements.mockUiContainer.innerHTML = `
        <div class="mock-screen">
            <div class="mock-success">
                <div class="success-icon">🎉</div>
                <div class="success-title">Simulation Complete!</div>
                <div class="success-message">Tất cả các bước đã được thực hiện thành công</div>
                <button class="mock-btn" onclick="resetSimulation()">Chạy Lại</button>
            </div>
        </div>
    `;
}

function renderGenericStep(step) {
    return `
        <div class="mock-form">
            <div class="mock-form-title">${step.icon} ${step.action}</div>
            <p style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">${step.description}</p>
        </div>
    `;
}

// ========================================
// Logging
// ========================================

function addLog(type, message) {
    const time = new Date().toLocaleTimeString('vi-VN');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="log-time">${time}</span><span class="log-message">${message}</span>`;
    elements.logContainer.appendChild(entry);
    elements.logContainer.scrollTop = elements.logContainer.scrollHeight;
    
    // Keep only last 20 entries
    while (elements.logContainer.children.length > 20) {
        elements.logContainer.removeChild(elements.logContainer.firstChild);
    }
}

// ========================================
// Start
// ========================================

document.addEventListener('DOMContentLoaded', init);
