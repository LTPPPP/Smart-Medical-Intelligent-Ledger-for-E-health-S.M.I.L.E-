/**
 * S.M.I.L.E Blockchain Service Simulation
 * Interactive workflow visualization for EHR blockchain operations
 */

// ========================================
// Workflow Definitions
// ========================================

const WORKFLOWS = {
    'create-ehr': {
        name: 'Create EHR Record',
        description: 'Quy trình tạo hồ sơ bệnh án điện tử mới trên blockchain',
        nodes: [
            { id: 'client', name: 'Client', icon: '👨‍⚕️', type: 'User Interface' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'Gin Framework' },
            { id: 'crypto', name: 'Encryption', icon: '🔐', type: 'AES-256-GCM' },
            { id: 'ipfs', name: 'IPFS', icon: '📦', type: 'Distributed Storage' },
            { id: 'fabric', name: 'Fabric', icon: '⛓️', type: 'Hyperledger' },
            { id: 'db', name: 'PostgreSQL', icon: '🗄️', type: 'Off-chain DB' }
        ],
        steps: [
            {
                from: 'client', to: 'api',
                name: 'Submit EHR Request',
                description: 'Client gửi yêu cầu tạo EHR với dữ liệu FHIR, patientID, và danh sách ACL',
                log: 'POST /v1/ehr - CreateEHR request received',
                data: { action: 'CreateEHRRequest', patientId: 'PAT-001', recordType: 'Observation' }
            },
            {
                from: 'api', to: 'api',
                name: 'JWT Authentication',
                description: 'Xác thực token JWT và lấy thông tin user từ claims',
                log: 'JWT validated - User: Dr.Nguyen, Role: Doctor, Hospital: HospitalA',
                data: { userId: 'Org1MSP.doctor1', role: 'doctor', hospitalId: 'hospital-a' }
            },
            {
                from: 'api', to: 'crypto',
                name: 'Generate Data Key',
                description: 'Tạo khóa AES-256 ngẫu nhiên cho việc mã hóa dữ liệu EHR',
                log: 'Generated 256-bit AES key for data encryption',
                data: { keySize: 256, algorithm: 'AES-GCM' }
            },
            {
                from: 'crypto', to: 'crypto',
                name: 'Encrypt FHIR Data',
                description: 'Mã hóa dữ liệu FHIR bằng AES-256-GCM với IV ngẫu nhiên',
                log: 'FHIR data encrypted: base64(IV + ciphertext + auth_tag)',
                data: { method: 'AES-256-GCM', outputFormat: 'base64' }
            },
            {
                from: 'crypto', to: 'ipfs',
                name: 'Upload to IPFS',
                description: 'Tải dữ liệu đã mã hóa lên IPFS và nhận Content Identifier (CID)',
                log: 'File uploaded to IPFS - CID: Qm...abc123',
                data: { cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' }
            },
            {
                from: 'api', to: 'api',
                name: 'Calculate SHA-256 Hash',
                description: 'Tính hash SHA-256 của dữ liệu gốc để đảm bảo tính toàn vẹn',
                log: 'SHA-256 hash computed: 0x7f83b166...e240ff',
                data: { algorithm: 'SHA-256', purpose: 'integrity verification' }
            },
            {
                from: 'api', to: 'fabric',
                name: 'Invoke CreateRecord',
                description: 'Gọi chaincode CreateRecord để lưu metadata lên blockchain Fabric',
                log: 'Chaincode invoked: CreateRecord(recordMetadata)',
                data: { function: 'CreateRecord', endorsers: ['peer0.org1', 'peer0.org2'] }
            },
            {
                from: 'fabric', to: 'fabric',
                name: 'Endorsement & Ordering',
                description: 'Các peer endorse transaction, orderer sắp xếp và tạo block mới',
                log: 'Transaction endorsed by 2 peers, block #1234 created',
                data: { txId: 'tx_001_abc', blockNumber: 1234 }
            },
            {
                from: 'fabric', to: 'fabric',
                name: 'Commit to Ledger',
                description: 'Block được commit vào ledger của tất cả các peer trong channel',
                log: 'Block committed to ledger across all peers',
                data: { status: 'VALID', commitTime: '150ms' }
            },
            {
                from: 'api', to: 'db',
                name: 'Store Off-chain Metadata',
                description: 'Lưu metadata vào PostgreSQL để query nhanh (index)',
                log: 'EHRRecord saved to PostgreSQL with chainTxId reference',
                data: { table: 'ehr_records', recordId: 'REC-001' }
            },
            {
                from: 'api', to: 'fabric',
                name: 'Log Access Event',
                description: 'Ghi log truy cập vào blockchain để audit trail',
                log: 'Access logged: CREATE action by doctor on REC-001',
                data: { action: 'CREATE', success: true }
            },
            {
                from: 'api', to: 'client',
                name: 'Return Success Response',
                description: 'Trả về kết quả thành công với recordId, CID, hash và txId',
                log: 'Response: 201 Created - RecordID: REC-001',
                data: { status: 201, recordId: 'REC-001', cid: 'Qm...', chainTxId: 'tx_001' }
            }
        ]
    },
    
    'get-ehr': {
        name: 'Get EHR Record',
        description: 'Quy trình truy xuất hồ sơ bệnh án từ blockchain',
        nodes: [
            { id: 'client', name: 'Client', icon: '👨‍⚕️', type: 'User Interface' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'Gin Framework' },
            { id: 'fabric', name: 'Fabric', icon: '⛓️', type: 'Hyperledger' },
            { id: 'ipfs', name: 'IPFS', icon: '📦', type: 'Distributed Storage' },
            { id: 'crypto', name: 'Decryption', icon: '🔓', type: 'AES-256-GCM' }
        ],
        steps: [
            {
                from: 'client', to: 'api',
                name: 'Request EHR Record',
                description: 'Client gửi yêu cầu lấy EHR record theo recordId',
                log: 'GET /v1/ehr/REC-001 - GetEHR request received',
                data: { recordId: 'REC-001' }
            },
            {
                from: 'api', to: 'fabric',
                name: 'Check Access Control',
                description: 'Gọi chaincode CheckAccess để xác minh quyền truy cập',
                log: 'Chaincode: CheckAccess(REC-001, Org1MSP.doctor1)',
                data: { function: 'CheckAccess' }
            },
            {
                from: 'fabric', to: 'fabric',
                name: 'Verify ACL',
                description: 'Kiểm tra accessor có trong danh sách ACL của record',
                log: 'ACL check passed - accessor in allowed list',
                data: { hasAccess: true, acl: ['Org1MSP.doctor1', 'Org1MSP.admin'] }
            },
            {
                from: 'fabric', to: 'api',
                name: 'Return Metadata',
                description: 'Trả về metadata bao gồm CID và encrypted key',
                log: 'Metadata retrieved: CID, hash, recordType, createdAt',
                data: { cid: 'Qm...', hash: '0x7f83...', recordType: 'Observation' }
            },
            {
                from: 'api', to: 'ipfs',
                name: 'Fetch from IPFS',
                description: 'Tải dữ liệu đã mã hóa từ IPFS bằng CID',
                log: 'IPFS cat: fetching encrypted data from Qm...',
                data: { operation: 'cat', cid: 'Qm...' }
            },
            {
                from: 'ipfs', to: 'crypto',
                name: 'Decrypt Data',
                description: 'Giải mã dữ liệu FHIR bằng data key',
                log: 'Decrypting with AES-256-GCM...',
                data: { method: 'AES-256-GCM' }
            },
            {
                from: 'crypto', to: 'api',
                name: 'Verify Hash',
                description: 'Xác minh hash SHA-256 để đảm bảo dữ liệu không bị thay đổi',
                log: 'Hash verification passed - data integrity confirmed',
                data: { verified: true }
            },
            {
                from: 'api', to: 'fabric',
                name: 'Log Access Event',
                description: 'Ghi log truy cập READ vào blockchain',
                log: 'Access logged: READ action on REC-001',
                data: { action: 'READ', success: true }
            },
            {
                from: 'api', to: 'client',
                name: 'Return EHR Data',
                description: 'Trả về dữ liệu FHIR đã giải mã cho client',
                log: 'Response: 200 OK - FHIR Observation data returned',
                data: { status: 200, recordType: 'Observation' }
            }
        ]
    },
    
    'consent': {
        name: 'Consent Management',
        description: 'Quy trình quản lý đồng ý chia sẻ dữ liệu y tế',
        nodes: [
            { id: 'patient', name: 'Patient', icon: '🧑‍🦰', type: 'Data Owner' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'Gin Framework' },
            { id: 'fabric', name: 'Fabric', icon: '⛓️', type: 'Hyperledger' },
            { id: 'target', name: 'Target Hospital', icon: '🏥', type: 'Healthcare Provider' }
        ],
        steps: [
            {
                from: 'patient', to: 'api',
                name: 'Grant Consent Request',
                description: 'Bệnh nhân gửi yêu cầu cấp quyền truy cập cho bệnh viện đích',
                log: 'POST /v1/consent - GrantConsent request from patient',
                data: { targetHospital: 'Hospital-B', purpose: 'emergency_care' }
            },
            {
                from: 'api', to: 'api',
                name: 'Validate Patient Identity',
                description: 'Xác thực danh tính bệnh nhân qua JWT và DID',
                log: 'Patient identity verified: DID:smile:patient:001',
                data: { patientDID: 'DID:smile:patient:001' }
            },
            {
                from: 'api', to: 'api',
                name: 'Create Consent Record',
                description: 'Tạo consent record với scope, expiry và signature',
                log: 'Consent record created with 30-day expiry',
                data: { expiresIn: '30 days', scope: ['read', 'share'] }
            },
            {
                from: 'api', to: 'fabric',
                name: 'Invoke CreateConsent',
                description: 'Gọi chaincode để lưu consent lên blockchain',
                log: 'Chaincode: CreateConsent(consentRecord)',
                data: { function: 'CreateConsent', consentId: 'CNS-001' }
            },
            {
                from: 'fabric', to: 'fabric',
                name: 'Store on Ledger',
                description: 'Consent được lưu trữ bất biến trên ledger',
                log: 'Consent CNS-001 committed to blockchain',
                data: { txId: 'tx_consent_001', status: 'active' }
            },
            {
                from: 'fabric', to: 'target',
                name: 'Notify Target Hospital',
                description: 'Thông báo cho bệnh viện đích về quyền truy cập mới',
                log: 'Event emitted: ConsentGranted to Hospital-B',
                data: { event: 'ConsentGranted' }
            },
            {
                from: 'api', to: 'patient',
                name: 'Confirm to Patient',
                description: 'Xác nhận đã cấp quyền thành công',
                log: 'Response: 201 Created - Consent granted successfully',
                data: { status: 201, consentId: 'CNS-001' }
            }
        ]
    },
    
    'cross-chain': {
        name: 'Cross-chain Transfer',
        description: 'Quy trình chuyển giao dữ liệu giữa các blockchain khác nhau',
        nodes: [
            { id: 'source', name: 'Source Chain', icon: '🔷', type: 'Fabric Network' },
            { id: 'bridge', name: 'Bridge Service', icon: '🌉', type: 'ECDSA Gateway' },
            { id: 'gateway', name: 'Gateway', icon: '🚪', type: 'Cross-chain Router' },
            { id: 'target', name: 'Target Chain', icon: '🔶', type: 'Quorum Network' }
        ],
        steps: [
            {
                from: 'source', to: 'bridge',
                name: 'Initiate Transfer',
                description: 'Yêu cầu chuyển record từ Fabric sang chain đích',
                log: 'InitiateTransfer(REC-001, quorum-hospital-b)',
                data: { recordId: 'REC-001', targetChain: 'quorum-hospital-b' }
            },
            {
                from: 'bridge', to: 'source',
                name: 'Query Record Metadata',
                description: 'Truy vấn metadata của record từ source chain',
                log: 'QueryRecordMetadata: CID, hash, patientId retrieved',
                data: { cid: 'Qm...', hash: '0x7f83...' }
            },
            {
                from: 'bridge', to: 'bridge',
                name: 'Create CrossChain Message',
                description: 'Tạo message với CID, hash, provenance và timestamp',
                log: 'CrossChainMessage created with FHIR metadata',
                data: { sourceChain: 'fabric-ehr-network', timestamp: Date.now() }
            },
            {
                from: 'bridge', to: 'bridge',
                name: 'Sign with ECDSA',
                description: 'Ký message bằng private key ECDSA P-256',
                log: 'Message signed: r||s = base64(signature)',
                data: { algorithm: 'ECDSA-P256', signedBy: 'Org1MSP.admin1' }
            },
            {
                from: 'bridge', to: 'source',
                name: 'Create Provisioning Event',
                description: 'Tạo event theo dõi trạng thái transfer trên source chain',
                log: 'ProvisioningEvent created: EVT-001 status=pending',
                data: { eventId: 'EVT-001', status: 'pending' }
            },
            {
                from: 'bridge', to: 'gateway',
                name: 'Route to Target',
                description: 'Gateway định tuyến message đến target chain',
                log: 'Gateway routing to quorum-hospital-b',
                data: { protocol: 'HTTP/gRPC' }
            },
            {
                from: 'gateway', to: 'target',
                name: 'Verify & Submit',
                description: 'Target chain xác minh signature và submit transaction',
                log: 'Signature verified, CreateAnchor submitted',
                data: { function: 'CreateAnchor', verified: true }
            },
            {
                from: 'target', to: 'target',
                name: 'Anchor Record',
                description: 'Tạo anchor reference đến record gốc trên target chain',
                log: 'Anchor created on Quorum: hash, CID reference stored',
                data: { anchorId: 'ANCHOR-001' }
            },
            {
                from: 'target', to: 'bridge',
                name: 'Acknowledge Completion',
                description: 'Gửi xác nhận hoàn thành về bridge service',
                log: 'Transfer acknowledgment received',
                data: { status: 'completed' }
            },
            {
                from: 'bridge', to: 'source',
                name: 'Update Event Status',
                description: 'Cập nhật trạng thái event thành completed',
                log: 'ProvisioningEvent EVT-001 status=completed',
                data: { eventId: 'EVT-001', status: 'completed' }
            }
        ]
    },
    
    'audit': {
        name: 'Audit Log Query',
        description: 'Quy trình truy vấn lịch sử truy cập và audit trail',
        nodes: [
            { id: 'auditor', name: 'Auditor', icon: '👨‍💼', type: 'Compliance Officer' },
            { id: 'api', name: 'API Server', icon: '🖥️', type: 'Gin Framework' },
            { id: 'fabric', name: 'Fabric', icon: '⛓️', type: 'Hyperledger' },
            { id: 'report', name: 'Report', icon: '📊', type: 'Audit Summary' }
        ],
        steps: [
            {
                from: 'auditor', to: 'api',
                name: 'Request Audit Report',
                description: 'Auditor yêu cầu báo cáo audit theo khoảng thời gian',
                log: 'GET /v1/audit/report - period: last 30 days',
                data: { startDate: '2026-12-15', endDate: '2026-01-15' }
            },
            {
                from: 'api', to: 'api',
                name: 'Verify Auditor Role',
                description: 'Xác minh user có role auditor và quyền xem audit logs',
                log: 'Role verification: auditor role confirmed',
                data: { role: 'auditor', permissions: ['read_audit'] }
            },
            {
                from: 'api', to: 'fabric',
                name: 'Query Access Logs',
                description: 'Truy vấn access logs từ blockchain theo time range',
                log: 'Chaincode: QueryAccessLogs(startTime, endTime)',
                data: { function: 'QueryAccessLogs' }
            },
            {
                from: 'fabric', to: 'fabric',
                name: 'Execute Rich Query',
                description: 'CouchDB rich query với selector trên timestamp',
                log: 'CouchDB query executed, 150 log entries found',
                data: { entriesFound: 150 }
            },
            {
                from: 'fabric', to: 'api',
                name: 'Return Log Entries',
                description: 'Trả về danh sách access logs với pagination',
                log: 'Logs retrieved: 150 entries, page 1/3',
                data: { totalEntries: 150, pageSize: 50 }
            },
            {
                from: 'api', to: 'api',
                name: 'Aggregate Statistics',
                description: 'Tổng hợp thống kê: số lần truy cập, user activity, anomalies',
                log: 'Stats: 120 reads, 25 creates, 5 updates, 0 anomalies',
                data: { reads: 120, creates: 25, updates: 5 }
            },
            {
                from: 'api', to: 'report',
                name: 'Generate Report',
                description: 'Tạo báo cáo audit với charts và summary',
                log: 'Audit report generated: compliance score 98%',
                data: { complianceScore: '98%', format: 'JSON' }
            },
            {
                from: 'api', to: 'auditor',
                name: 'Return Audit Report',
                description: 'Trả về báo cáo audit đầy đủ cho auditor',
                log: 'Response: 200 OK - Audit report delivered',
                data: { status: 200 }
            }
        ]
    }
};

// ========================================
// Workflow Simulator Class
// ========================================

class WorkflowSimulator {
    constructor() {
        this.currentWorkflow = 'create-ehr';
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
