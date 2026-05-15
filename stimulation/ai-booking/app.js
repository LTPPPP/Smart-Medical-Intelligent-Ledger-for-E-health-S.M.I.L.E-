/**
 * S.M.I.L.E Booking Orchestrator Simulation
 * Interactive workflow visualization for AI-powered appointment booking
 */

// ========================================
// Workflow Definitions
// ========================================

const WORKFLOWS = {
    'book-appointment': {
        name: 'Book Appointment',
        description: 'Quy trình đặt lịch hẹn khám nha khoa qua AI Orchestrator',
        nodes: [
            { id: 'patient', name: 'Patient', icon: '🧑‍🦰', type: 'User Input' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'FastAPI' },
            { id: 'normalizer', name: 'Normalizer', icon: '📝', type: 'Text Processing' },
            { id: 'intent', name: 'Intent Classifier', icon: '🎯', type: 'ML Model' },
            { id: 'entity', name: 'Entity Extractor', icon: '🔍', type: 'NLP/spaCy' },
            { id: 'api-caller', name: 'API Caller', icon: '📡', type: 'HTTP Client' },
            { id: 'db', name: 'Database', icon: '🗄️', type: 'PostgreSQL' },
            { id: 'llm', name: 'LLM', icon: '🤖', type: 'OpenAI GPT' },
        ],
        steps: [
            {
                from: 'patient', to: 'api',
                name: 'Submit Booking Request',
                description: 'Bệnh nhân gửi yêu cầu đặt lịch hẹn bằng ngôn ngữ tự nhiên',
                log: 'POST /api/process - "Tôi muốn đặt lịch với bác sĩ Nguyễn vào thứ 7 lúc 9h"',
                data: { message: 'Tôi muốn đặt lịch với bác sĩ Nguyễn vào thứ 7 lúc 9h', userId: 'PAT-001' }
            },
            {
                from: 'api', to: 'api',
                name: 'JWT Authentication',
                description: 'Xác thực token JWT và lấy thông tin user',
                log: 'JWT validated - User: PAT-001, Role: patient',
                data: { userId: 'PAT-001', role: 'patient', sessionId: 'sess_abc123' }
            },
            {
                from: 'api', to: 'normalizer',
                name: 'Text Normalization',
                description: 'Chuẩn hóa văn bản: chuyển về chữ thường, loại bỏ ký tự đặc biệt',
                log: 'TextNormalizer: Normalizing Vietnamese text input',
                data: { input: 'Tôi muốn đặt lịch...', normalized: 'toi muon dat lich...' }
            },
            {
                from: 'normalizer', to: 'intent',
                name: 'Intent Classification',
                description: 'Phân loại ý định người dùng bằng TF-IDF + Logistic Regression',
                log: 'IntentClassifier: intent=book_appointment, confidence=0.95',
                data: { intent: 'book_appointment', confidence: 0.95, allScores: { book_appointment: 0.95, cancel: 0.02 } }
            },
            {
                from: 'intent', to: 'entity',
                name: 'Entity Extraction',
                description: 'Trích xuất thực thể: bác sĩ, ngày, giờ, loại dịch vụ bằng spaCy + Regex',
                log: 'EntityExtractor: doctor="Nguyễn", date="2026-01-18", time="09:00"',
                data: { doctor: 'Dr. Nguyễn', date: '2026-01-18', time: '09:00', service: 'general_checkup' }
            },
            {
                from: 'entity', to: 'api-caller',
                name: 'Prepare API Request',
                description: 'Chuẩn bị request gọi Booking API với dữ liệu đã trích xuất',
                log: 'APICaller: Preparing POST /api/booking/create request',
                data: { endpoint: '/api/booking/create', method: 'POST' }
            },
            {
                from: 'api-caller', to: 'db',
                name: 'Check Doctor Availability',
                description: 'Kiểm tra lịch trống của bác sĩ trong database',
                log: 'DB Query: SELECT * FROM doctor_schedules WHERE doctor_id=? AND date=?',
                data: { query: 'check_availability', doctorId: 'DOC-001', date: '2026-01-18' }
            },
            {
                from: 'db', to: 'api-caller',
                name: 'Availability Confirmed',
                description: 'Xác nhận bác sĩ có lịch trống vào thời gian yêu cầu',
                log: 'Availability check passed: slot 09:00 is available',
                data: { available: true, slot: '09:00-09:30' }
            },
            {
                from: 'api-caller', to: 'db',
                name: 'Create Appointment',
                description: 'Lưu thông tin lịch hẹn vào database',
                log: 'DB Insert: appointments table - APT-98765',
                data: { appointmentId: 'APT-98765', status: 'confirmed' }
            },
            {
                from: 'db', to: 'api',
                name: 'Appointment Created',
                description: 'Database trả về kết quả tạo lịch hẹn thành công',
                log: 'Appointment APT-98765 created successfully',
                data: { success: true, appointmentId: 'APT-98765', txId: 'tx_booking_001' }
            },
            {
                from: 'api', to: 'llm',
                name: 'Generate Response',
                description: 'Sử dụng LLM để tạo phản hồi tự nhiên cho người dùng',
                log: 'LLM: Generating natural language response with OpenAI GPT',
                data: { model: 'gpt-4', temperature: 0.7 }
            },
            {
                from: 'llm', to: 'api',
                name: 'Response Generated',
                description: 'LLM trả về câu trả lời được cá nhân hóa',
                log: 'LLM response: "Tôi đã đặt lịch hẹn thành công..."',
                data: { tokensUsed: 150 }
            },
            {
                from: 'api', to: 'patient',
                name: 'Return Confirmation',
                description: 'Trả về xác nhận đặt lịch cho bệnh nhân',
                log: 'Response 200: Lịch hẹn APT-98765 đã được đặt thành công!',
                data: { status: 200, appointmentId: 'APT-98765', doctor: 'Dr. Nguyễn', datetime: '2026-01-18 09:00' }
            }
        ]
    },

    'cancel-appointment': {
        name: 'Cancel Appointment',
        description: 'Quy trình hủy lịch hẹn đã đặt trước đó',
        nodes: [
            { id: 'patient', name: 'Patient', icon: '🧑‍🦰', type: 'User Input' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'FastAPI' },
            { id: 'intent', name: 'Intent Classifier', icon: '🎯', type: 'ML Model' },
            { id: 'entity', name: 'Entity Extractor', icon: '🔍', type: 'NLP/spaCy' },
            { id: 'api-caller', name: 'API Caller', icon: '📡', type: 'HTTP Client' },
            { id: 'db', name: 'Database', icon: '🗄️', type: 'PostgreSQL' },
            { id: 'llm', name: 'LLM', icon: '🤖', type: 'OpenAI GPT' }
        ],
        steps: [
            {
                from: 'patient', to: 'api',
                name: 'Submit Cancel Request',
                description: 'Bệnh nhân yêu cầu hủy lịch hẹn',
                log: 'POST /api/process - "Tôi muốn hủy lịch hẹn APT-98765"',
                data: { message: 'Tôi muốn hủy lịch hẹn APT-98765' }
            },
            {
                from: 'api', to: 'intent',
                name: 'Intent Classification',
                description: 'Phân loại ý định: cancel_appointment',
                log: 'IntentClassifier: intent=cancel_appointment, confidence=0.98',
                data: { intent: 'cancel_appointment', confidence: 0.98 }
            },
            {
                from: 'intent', to: 'entity',
                name: 'Extract Appointment ID',
                description: 'Trích xuất mã lịch hẹn từ tin nhắn',
                log: 'EntityExtractor: appointment_id="APT-98765"',
                data: { appointmentId: 'APT-98765' }
            },
            {
                from: 'entity', to: 'api-caller',
                name: 'Prepare Cancel Request',
                description: 'Chuẩn bị request hủy lịch hẹn',
                log: 'APICaller: Preparing POST /api/booking/cancel',
                data: { endpoint: '/api/booking/cancel' }
            },
            {
                from: 'api-caller', to: 'db',
                name: 'Verify Appointment',
                description: 'Xác minh lịch hẹn tồn tại và thuộc về bệnh nhân',
                log: 'DB Query: SELECT * FROM appointments WHERE id=? AND patient_id=?',
                data: { appointmentId: 'APT-98765', verified: true }
            },
            {
                from: 'db', to: 'db',
                name: 'Update Appointment Status',
                description: 'Cập nhật trạng thái lịch hẹn thành "cancelled"',
                log: 'DB Update: appointments SET status="cancelled" WHERE id=APT-98765',
                data: { status: 'cancelled' }
            },
            {
                from: 'db', to: 'api',
                name: 'Cancellation Confirmed',
                description: 'Database xác nhận đã hủy lịch hẹn thành công',
                log: 'Appointment APT-98765 cancelled successfully',
                data: { success: true }
            },
            {
                from: 'api', to: 'llm',
                name: 'Generate Response',
                description: 'Tạo phản hồi xác nhận hủy lịch',
                log: 'LLM: Generating cancellation confirmation',
                data: { model: 'gpt-4' }
            },
            {
                from: 'llm', to: 'patient',
                name: 'Return Confirmation',
                description: 'Trả về xác nhận hủy lịch cho bệnh nhân',
                log: 'Response 200: Lịch hẹn APT-98765 đã được hủy thành công',
                data: { status: 200, message: 'Appointment cancelled' }
            }
        ]
    },

    'reschedule-appointment': {
        name: 'Reschedule Appointment',
        description: 'Quy trình đổi lịch hẹn sang thời gian khác',
        nodes: [
            { id: 'patient', name: 'Patient', icon: '🧑‍🦰', type: 'User Input' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'FastAPI' },
            { id: 'intent', name: 'Intent Classifier', icon: '🎯', type: 'ML Model' },
            { id: 'entity', name: 'Entity Extractor', icon: '🔍', type: 'NLP/spaCy' },
            { id: 'api-caller', name: 'API Caller', icon: '📡', type: 'HTTP Client' },
            { id: 'db', name: 'Database', icon: '🗄️', type: 'PostgreSQL' },
            { id: 'llm', name: 'LLM', icon: '🤖', type: 'OpenAI GPT' }
        ],
        steps: [
            {
                from: 'patient', to: 'api',
                name: 'Submit Reschedule Request',
                description: 'Bệnh nhân yêu cầu đổi lịch hẹn',
                log: 'POST /api/process - "Tôi muốn đổi lịch hẹn sang 10h thứ 2"',
                data: { message: 'Tôi muốn đổi lịch hẹn sang 10h thứ 2' }
            },
            {
                from: 'api', to: 'intent',
                name: 'Intent Classification',
                description: 'Phân loại ý định: reschedule_appointment',
                log: 'IntentClassifier: intent=reschedule_appointment, confidence=0.92',
                data: { intent: 'reschedule_appointment', confidence: 0.92 }
            },
            {
                from: 'intent', to: 'entity',
                name: 'Extract New DateTime',
                description: 'Trích xuất thời gian mới từ tin nhắn',
                log: 'EntityExtractor: new_date="2026-01-20", new_time="10:00"',
                data: { newDate: '2026-01-20', newTime: '10:00' }
            },
            {
                from: 'entity', to: 'api-caller',
                name: 'Prepare Reschedule Request',
                description: 'Chuẩn bị request đổi lịch',
                log: 'APICaller: Preparing POST /api/booking/reschedule',
                data: { endpoint: '/api/booking/reschedule' }
            },
            {
                from: 'api-caller', to: 'db',
                name: 'Check New Slot Availability',
                description: 'Kiểm tra slot mới có trống không',
                log: 'DB Query: Checking availability for 2026-01-20 10:00',
                data: { newSlot: '10:00-10:30', available: true }
            },
            {
                from: 'db', to: 'db',
                name: 'Update Appointment',
                description: 'Cập nhật thời gian lịch hẹn trong database',
                log: 'DB Update: appointments SET date=2026-01-20, time=10:00',
                data: { updated: true }
            },
            {
                from: 'db', to: 'api',
                name: 'Reschedule Confirmed',
                description: 'Xác nhận đổi lịch thành công',
                log: 'Appointment rescheduled to 2026-01-20 10:00',
                data: { success: true }
            },
            {
                from: 'api', to: 'llm',
                name: 'Generate Response',
                description: 'Tạo phản hồi xác nhận đổi lịch',
                log: 'LLM: Generating reschedule confirmation',
                data: { model: 'gpt-4' }
            },
            {
                from: 'llm', to: 'patient',
                name: 'Return Confirmation',
                description: 'Trả về xác nhận đổi lịch cho bệnh nhân',
                log: 'Response 200: Lịch hẹn đã được đổi sang 10h ngày 20/01/2026',
                data: { status: 200, newDateTime: '2026-01-20 10:00' }
            }
        ]
    },

    'get-schedule': {
        name: 'Get Schedule / Availability',
        description: 'Quy trình truy vấn lịch hẹn hoặc kiểm tra lịch trống của bác sĩ',
        nodes: [
            { id: 'patient', name: 'Patient', icon: '🧑‍🦰', type: 'User Input' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'FastAPI' },
            { id: 'intent', name: 'Intent Classifier', icon: '🎯', type: 'ML Model' },
            { id: 'entity', name: 'Entity Extractor', icon: '🔍', type: 'NLP/spaCy' },
            { id: 'api-caller', name: 'API Caller', icon: '📡', type: 'HTTP Client' },
            { id: 'db', name: 'Database', icon: '🗄️', type: 'PostgreSQL' },
            { id: 'llm', name: 'LLM', icon: '🤖', type: 'OpenAI GPT' }
        ],
        steps: [
            {
                from: 'patient', to: 'api',
                name: 'Submit Query',
                description: 'Bệnh nhân hỏi về lịch khám của bác sĩ',
                log: 'POST /api/process - "Bác sĩ Nguyễn có lịch trống vào thứ 7 không?"',
                data: { message: 'Bác sĩ Nguyễn có lịch trống vào thứ 7 không?' }
            },
            {
                from: 'api', to: 'intent',
                name: 'Intent Classification',
                description: 'Phân loại ý định: ask_availability',
                log: 'IntentClassifier: intent=ask_availability, confidence=0.94',
                data: { intent: 'ask_availability', confidence: 0.94 }
            },
            {
                from: 'intent', to: 'entity',
                name: 'Extract Query Params',
                description: 'Trích xuất thông tin: bác sĩ và ngày',
                log: 'EntityExtractor: doctor="Nguyễn", date="2026-01-18"',
                data: { doctor: 'Nguyễn', date: '2026-01-18' }
            },
            {
                from: 'entity', to: 'api-caller',
                name: 'Prepare Query',
                description: 'Chuẩn bị request truy vấn lịch bác sĩ',
                log: 'APICaller: Preparing GET /api/doctors/availability',
                data: { endpoint: '/api/doctors/availability' }
            },
            {
                from: 'api-caller', to: 'db',
                name: 'Query Doctor Schedules',
                description: 'Truy vấn lịch làm việc của bác sĩ từ database',
                log: 'DB Query: SELECT * FROM doctor_schedules WHERE doctor_name LIKE ?',
                data: { doctorId: 'DOC-001' }
            },
            {
                from: 'db', to: 'api',
                name: 'Return Available Slots',
                description: 'Trả về danh sách các slot còn trống',
                log: 'Found 5 available slots on 2026-01-18',
                data: { slots: ['08:00', '09:00', '10:00', '14:00', '15:00'] }
            },
            {
                from: 'api', to: 'llm',
                name: 'Generate Response',
                description: 'Tạo phản hồi với danh sách lịch trống',
                log: 'LLM: Formatting schedule response',
                data: { model: 'gpt-4' }
            },
            {
                from: 'llm', to: 'patient',
                name: 'Return Schedule Info',
                description: 'Trả về thông tin lịch khám cho bệnh nhân',
                log: 'Response 200: Bác sĩ Nguyễn có lịch trống lúc 8h, 9h, 10h, 14h, 15h',
                data: { status: 200, availableSlots: 5 }
            }
        ]
    },

    'system-query': {
        name: 'System Query',
        description: 'Quy trình trả lời câu hỏi về hệ thống và phòng khám',
        nodes: [
            { id: 'patient', name: 'Patient', icon: '🧑‍🦰', type: 'User Input' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'FastAPI' },
            { id: 'intent', name: 'Intent Classifier', icon: '🎯', type: 'ML Model' },
            { id: 'knowledge', name: 'Knowledge Base', icon: '📚', type: 'System Info' },
            { id: 'llm', name: 'LLM', icon: '🤖', type: 'OpenAI GPT' }
        ],
        steps: [
            {
                from: 'patient', to: 'api',
                name: 'Submit Question',
                description: 'Bệnh nhân hỏi về thông tin phòng khám',
                log: 'POST /api/system/query - "Phòng khám mở cửa lúc mấy giờ?"',
                data: { query: 'Phòng khám mở cửa lúc mấy giờ?' }
            },
            {
                from: 'api', to: 'intent',
                name: 'Intent Classification',
                description: 'Phân loại ý định: ask_system',
                log: 'IntentClassifier: intent=ask_system, confidence=0.96',
                data: { intent: 'ask_system', confidence: 0.96 }
            },
            {
                from: 'intent', to: 'knowledge',
                name: 'Query Knowledge Base',
                description: 'Truy vấn cơ sở tri thức về phòng khám',
                log: 'KnowledgeBase: Searching for "working_hours" information',
                data: { topic: 'working_hours' }
            },
            {
                from: 'knowledge', to: 'knowledge',
                name: 'Retrieve Information',
                description: 'Lấy thông tin giờ làm việc từ knowledge base',
                log: 'Found: working_hours = "8:00 - 20:00, T2-T7"',
                data: { workingHours: '8:00 - 20:00', days: 'Thứ 2 - Thứ 7' }
            },
            {
                from: 'knowledge', to: 'llm',
                name: 'Generate Response',
                description: 'LLM tạo phản hồi tự nhiên từ thông tin knowledge base',
                log: 'LLM: Generating friendly response with working hours info',
                data: { model: 'gpt-4', context: 'system_info' }
            },
            {
                from: 'llm', to: 'api',
                name: 'Response Generated',
                description: 'LLM trả về câu trả lời được định dạng',
                log: 'LLM response generated successfully',
                data: { tokensUsed: 80 }
            },
            {
                from: 'api', to: 'patient',
                name: 'Return Answer',
                description: 'Trả về thông tin cho bệnh nhân',
                log: 'Response 200: Phòng khám mở cửa từ 8:00 - 20:00, từ Thứ 2 đến Thứ 7',
                data: { status: 200, message: 'Working hours provided' }
            }
        ]
    }
};

// ========================================
// Workflow Simulator Class
// ========================================

class WorkflowSimulator {
    constructor() {
        this.currentWorkflow = 'book-appointment';
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
        this.loadWorkflow(this.currentWorkflow);
    }
    
    bindElements() {
        this.elements = {
            diagram: document.getElementById('architecture-diagram'),
            flowContainer: document.getElementById('flow-container'),
            workflowName: document.getElementById('workflow-name'),
            workflowDescription: document.getElementById('workflow-description'),
            logContainer: document.getElementById('log-container'),
            progressFill: document.getElementById('progress-fill'),
            currentStep: document.getElementById('current-step'),
            totalSteps: document.getElementById('total-steps'),
            stepName: document.getElementById('step-name'),
            stepDescription: document.getElementById('step-description'),
            btnPlay: document.getElementById('btn-play'),
            btnPause: document.getElementById('btn-pause'),
            btnReset: document.getElementById('btn-reset'),
            speedSlider: document.getElementById('speed-slider'),
            speedValue: document.getElementById('speed-value')
        };
    }
    
    bindEvents() {
        // Workflow buttons
        document.querySelectorAll('.workflow-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isRunning) this.reset();
                document.querySelectorAll('.workflow-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadWorkflow(btn.dataset.workflow);
            });
        });
        
        // Control buttons
        this.elements.btnPlay.addEventListener('click', () => this.start());
        this.elements.btnPause.addEventListener('click', () => this.pause());
        this.elements.btnReset.addEventListener('click', () => this.reset());
        
        // Speed slider
        this.elements.speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            this.elements.speedValue.textContent = `${this.speed}x`;
        });
    }
    
    loadWorkflow(workflowId) {
        this.currentWorkflow = workflowId;
        const workflow = WORKFLOWS[workflowId];
        
        // Update title
        this.elements.workflowName.textContent = workflow.name;
        this.elements.workflowDescription.textContent = workflow.description;
        
        // Update progress
        this.elements.totalSteps.textContent = workflow.steps.length;
        this.elements.currentStep.textContent = '0';
        this.elements.progressFill.style.width = '0%';
        
        // Render architecture diagram
        this.renderDiagram(workflow.nodes);
        
        // Clear logs
        this.clearLogs();
        this.addLog('info', `Loaded workflow: ${workflow.name}`);
        
        // Reset step detail
        this.elements.stepName.textContent = 'Ready';
        this.elements.stepDescription.textContent = 'Click Start to begin the simulation';
    }
    
    renderDiagram(nodes) {
        this.elements.diagram.innerHTML = '';
        
        nodes.forEach((node, index) => {
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
        if (this.isPaused) {
            this.resume();
            return;
        }
        
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
        
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
        
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
        
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
        
        // Reset UI
        this.elements.btnPlay.disabled = false;
        this.elements.btnPlay.innerHTML = '<span class="icon">▶</span> Start';
        this.elements.btnPause.disabled = true;
        this.elements.progressFill.style.width = '0%';
        this.elements.currentStep.textContent = '0';
        
        // Reset nodes
        document.querySelectorAll('.node').forEach(node => {
            node.classList.remove('active', 'completed', 'processing');
        });
        
        // Clear particles
        this.elements.flowContainer.innerHTML = '';
        
        // Reset step detail
        this.elements.stepName.textContent = 'Ready';
        this.elements.stepDescription.textContent = 'Click Start to begin the simulation';
        
        this.clearLogs();
        this.addLog('info', 'Simulation reset');
    }
    
    runStep() {
        const workflow = WORKFLOWS[this.currentWorkflow];
        
        if (this.currentStep >= workflow.steps.length) {
            this.complete();
            return;
        }
        
        const step = workflow.steps[this.currentStep];
        
        // Update progress
        this.elements.currentStep.textContent = this.currentStep + 1;
        const progress = ((this.currentStep + 1) / workflow.steps.length) * 100;
        this.elements.progressFill.style.width = `${progress}%`;
        
        // Update step detail
        this.elements.stepName.textContent = step.name;
        this.elements.stepDescription.textContent = step.description;
        
        // Add log
        this.addLog('info', step.log);
        
        // Animate nodes
        this.animateStep(step);
        
        // Schedule next step
        const baseDelay = 2000;
        const delay = baseDelay / this.speed;
        
        this.animationTimeout = setTimeout(() => {
            this.currentStep++;
            this.runStep();
        }, delay);
    }
    
    animateStep(step) {
        const fromNode = document.getElementById(`node-${step.from}`);
        const toNode = document.getElementById(`node-${step.to}`);
        
        if (!fromNode || !toNode) return;
        
        // Highlight active nodes
        document.querySelectorAll('.node').forEach(n => n.classList.remove('active', 'processing'));
        
        fromNode.classList.add('completed');
        toNode.classList.add('active', 'processing');
        
        // Create data particle animation
        if (step.from !== step.to) {
            this.animateParticle(fromNode, toNode);
        }
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
        
        // Animate particle
        const duration = 800 / this.speed;
        particle.animate([
            { left: `${startX}px`, top: `${startY}px`, opacity: 1, transform: 'scale(1)' },
            { left: `${endX}px`, top: `${endY}px`, opacity: 1, transform: 'scale(1.5)' }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        }).onfinish = () => {
            particle.remove();
        };
    }
    
    complete() {
        this.isRunning = false;
        this.elements.btnPlay.disabled = false;
        this.elements.btnPlay.innerHTML = '<span class="icon">▶</span> Start';
        this.elements.btnPause.disabled = true;
        
        // Mark all nodes as completed
        document.querySelectorAll('.node').forEach(node => {
            node.classList.remove('active', 'processing');
            node.classList.add('completed');
        });
        
        this.elements.stepName.textContent = 'Completed';
        this.elements.stepDescription.textContent = 'Workflow simulation finished successfully!';
        
        this.addLog('success', '✅ Workflow completed successfully!');
    }
    
    addLog(type, message) {
        const now = new Date();
        const time = now.toLocaleTimeString('vi-VN');
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-message">${message}</span>
        `;
        
        this.elements.logContainer.appendChild(logEntry);
        this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
    }
    
    clearLogs() {
        this.elements.logContainer.innerHTML = '';
    }
}

// ========================================
// Initialize Simulator
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    window.simulator = new WorkflowSimulator();
});
