/**
 * S.M.I.L.E AI Detection Simulation
 * Interactive workflow visualization for Dental Disease Classification
 */

// ========================================
// Workflow Definitions
// ========================================

const WORKFLOWS = {
    'model-training': {
        name: 'Model Training',
        description: 'Quy trình huấn luyện mô hình CNN phát hiện bệnh răng miệng',
        nodes: [
            { id: 'dataset', name: 'Dataset', icon: '📁', type: 'Oral Diseases' },
            { id: 'dataloader', name: 'DataLoader', icon: '🔄', type: 'PyTorch' },
            { id: 'transform', name: 'Transform', icon: '🔧', type: 'Augmentation' },
            { id: 'model', name: 'CNN Model', icon: '🧠', type: 'EfficientNet' },
            { id: 'loss', name: 'Loss Function', icon: '📉', type: 'BCE + Focal' },
            { id: 'optimizer', name: 'Optimizer', icon: '⚡', type: 'AdamW' },
            { id: 'checkpoint', name: 'Checkpoint', icon: '💾', type: 'Model State' }
        ],
        steps: [
            {
                from: 'dataset', to: 'dataset',
                name: 'Load Dataset',
                description: 'Tải dataset Oral Diseases với 6 lớp bệnh',
                log: 'Loading Oral Diseases dataset: 6 classes, 1500+ images',
                data: { classes: ['Calculus', 'Caries', 'Gingivitis', 'Hypodontia', 'Tooth Discoloration', 'Ulcers'] }
            },
            {
                from: 'dataset', to: 'dataloader',
                name: 'Create DataLoader',
                description: 'Tạo DataLoader với batch_size và shuffle',
                log: 'DataLoader created: batch_size=32, num_workers=4',
                data: { batchSize: 32, numWorkers: 4, shuffle: true }
            },
            {
                from: 'dataloader', to: 'transform',
                name: 'Apply Transforms',
                description: 'Áp dụng data augmentation: RandomRotation, ColorJitter, RandomFlip',
                log: 'Transforms: Resize(224), RandomRotation(15), ColorJitter, Normalize',
                data: { imageSize: 224, augmentations: ['rotation', 'color', 'flip'] }
            },
            {
                from: 'transform', to: 'model',
                name: 'Initialize Model',
                description: 'Khởi tạo EfficientNet-B0 với pretrained ImageNet weights',
                log: 'Model: EfficientNet-B0, pretrained=True, num_classes=6',
                data: { architecture: 'EfficientNet-B0', pretrained: true, numClasses: 6 }
            },
            {
                from: 'model', to: 'model',
                name: 'Forward Pass',
                description: 'Thực hiện forward pass qua CNN để tính output',
                log: 'Forward pass: input(32, 3, 224, 224) -> output(32, 6)',
                data: { inputShape: [32, 3, 224, 224], outputShape: [32, 6] }
            },
            {
                from: 'model', to: 'loss',
                name: 'Calculate Loss',
                description: 'Tính loss với BCE + Focal Loss cho multi-label',
                log: 'Loss computed: BCE=0.45, Focal=0.32, Total=0.77',
                data: { bceLoss: 0.45, focalLoss: 0.32, totalLoss: 0.77 }
            },
            {
                from: 'loss', to: 'optimizer',
                name: 'Backward Pass',
                description: 'Thực hiện backward propagation để tính gradients',
                log: 'Backward pass completed, gradients computed',
                data: { operation: 'backward()' }
            },
            {
                from: 'optimizer', to: 'optimizer',
                name: 'Update Weights',
                description: 'Cập nhật weights với AdamW optimizer',
                log: 'AdamW step: lr=0.001, weight_decay=0.01',
                data: { learningRate: 0.001, weightDecay: 0.01 }
            },
            {
                from: 'optimizer', to: 'model',
                name: 'Next Epoch',
                description: 'Lặp lại training cho epoch tiếp theo',
                log: 'Epoch 1/10 completed, val_loss=0.65, val_acc=0.78',
                data: { epoch: 1, valLoss: 0.65, valAcc: 0.78 }
            },
            {
                from: 'model', to: 'checkpoint',
                name: 'Save Checkpoint',
                description: 'Lưu best model checkpoint khi val_loss giảm',
                log: 'Checkpoint saved: best_model.pt (val_loss improved)',
                data: { filename: 'best_model.pt', valLoss: 0.42 }
            },
            {
                from: 'checkpoint', to: 'checkpoint',
                name: 'Training Complete',
                description: 'Hoàn thành training, lưu final model',
                log: 'Training completed! Final: val_acc=0.92, F1=0.89',
                data: { finalAccuracy: 0.92, f1Score: 0.89 }
            }
        ]
    },

    'image-inference': {
        name: 'Image Inference',
        description: 'Quy trình phân loại ảnh răng miệng với mô hình đã huấn luyện',
        nodes: [
            { id: 'image', name: 'Input Image', icon: '🖼️', type: 'Dental Photo' },
            { id: 'preprocess', name: 'Preprocess', icon: '🔧', type: 'Transform' },
            { id: 'model', name: 'CNN Model', icon: '🧠', type: 'EfficientNet' },
            { id: 'softmax', name: 'Softmax', icon: '📊', type: 'Activation' },
            { id: 'result', name: 'Prediction', icon: '✅', type: 'Disease Class' }
        ],
        steps: [
            {
                from: 'image', to: 'image',
                name: 'Receive Image',
                description: 'Nhận ảnh răng miệng từ người dùng',
                log: 'Image received: dental_scan.jpg (640x480, RGB)',
                data: { filename: 'dental_scan.jpg', size: '640x480' }
            },
            {
                from: 'image', to: 'preprocess',
                name: 'Resize Image',
                description: 'Resize ảnh về kích thước 224x224',
                log: 'Resizing image: 640x480 -> 224x224',
                data: { inputSize: '640x480', outputSize: '224x224' }
            },
            {
                from: 'preprocess', to: 'preprocess',
                name: 'Normalize',
                description: 'Chuẩn hóa pixel values với ImageNet mean/std',
                log: 'Normalize: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]',
                data: { mean: [0.485, 0.456, 0.406], std: [0.229, 0.224, 0.225] }
            },
            {
                from: 'preprocess', to: 'model',
                name: 'Create Tensor',
                description: 'Chuyển đổi image thành PyTorch tensor',
                log: 'Tensor created: shape=(1, 3, 224, 224), dtype=float32',
                data: { shape: [1, 3, 224, 224], dtype: 'float32' }
            },
            {
                from: 'model', to: 'model',
                name: 'Model Inference',
                description: 'Thực hiện inference với torch.no_grad()',
                log: 'Inference with EfficientNet-B0 (eval mode)',
                data: { mode: 'eval', noGrad: true }
            },
            {
                from: 'model', to: 'softmax',
                name: 'Get Logits',
                description: 'Lấy raw logits từ output layer',
                log: 'Logits: shape=(1, 6), raw scores obtained',
                data: { outputShape: [1, 6] }
            },
            {
                from: 'softmax', to: 'softmax',
                name: 'Apply Softmax',
                description: 'Áp dụng softmax để tính xác suất',
                log: 'Softmax applied: probabilities sum to 1.0',
                data: { operation: 'F.softmax(logits, dim=1)' }
            },
            {
                from: 'softmax', to: 'result',
                name: 'Get Top Prediction',
                description: 'Lấy class có xác suất cao nhất',
                log: 'Prediction: Caries (confidence=0.87)',
                data: { predictedClass: 'Caries', confidence: 0.87 }
            },
            {
                from: 'result', to: 'result',
                name: 'Return Result',
                description: 'Trả về kết quả chẩn đoán cho người dùng',
                log: 'Result: {"condition": "Caries", "confidence": 0.87}',
                data: { condition: 'Caries', confidence: 0.87, bbox: null }
            }
        ]
    },

    'model-export': {
        name: 'Model Export',
        description: 'Quy trình xuất mô hình sang định dạng triển khai',
        nodes: [
            { id: 'checkpoint', name: 'Checkpoint', icon: '💾', type: '.pt File' },
            { id: 'model', name: 'Load Model', icon: '🧠', type: 'PyTorch' },
            { id: 'trace', name: 'TorchScript', icon: '📜', type: 'JIT Trace' },
            { id: 'validate', name: 'Validate', icon: '✅', type: 'Verify' },
            { id: 'save', name: 'Export', icon: '📦', type: 'Deployment' }
        ],
        steps: [
            {
                from: 'checkpoint', to: 'checkpoint',
                name: 'Load Checkpoint',
                description: 'Tải file checkpoint đã lưu',
                log: 'Loading checkpoint: best_model.pt (45MB)',
                data: { filename: 'best_model.pt', size: '45MB' }
            },
            {
                from: 'checkpoint', to: 'model',
                name: 'Extract State Dict',
                description: 'Lấy model state dict từ checkpoint',
                log: 'Extracted: model_state_dict, model_name=efficientnet',
                data: { modelName: 'efficientnet', variant: 'b0' }
            },
            {
                from: 'model', to: 'model',
                name: 'Recreate Model',
                description: 'Tạo lại model architecture và load weights',
                log: 'Model recreated: EfficientNet-B0, weights loaded',
                data: { architecture: 'EfficientNet-B0', weightsLoaded: true }
            },
            {
                from: 'model', to: 'trace',
                name: 'JIT Trace',
                description: 'Trace model với example input để tạo TorchScript',
                log: 'Tracing model with example input (1, 3, 224, 224)',
                data: { exampleInput: [1, 3, 224, 224] }
            },
            {
                from: 'trace', to: 'trace',
                name: 'Compile Graph',
                description: 'Compile computation graph thành TorchScript',
                log: 'TorchScript graph compiled successfully',
                data: { format: 'TorchScript', optimized: true }
            },
            {
                from: 'trace', to: 'validate',
                name: 'Validation Check',
                description: 'So sánh output giữa original và traced model',
                log: 'Validation: max diff = 1e-6, output shapes match',
                data: { maxDiff: 1e-6, shapesMatch: true }
            },
            {
                from: 'validate', to: 'save',
                name: 'Save TorchScript',
                description: 'Lưu TorchScript model cho deployment',
                log: 'Saved: model_scripted.pt (portable format)',
                data: { filename: 'model_scripted.pt' }
            },
            {
                from: 'save', to: 'save',
                name: 'Export Complete',
                description: 'Model đã sẵn sàng cho production deployment',
                log: 'Export complete! Ready for deployment',
                data: { status: 'ready', format: 'TorchScript' }
            }
        ]
    },

    'model-evaluation': {
        name: 'Model Evaluation',
        description: 'Quy trình đánh giá hiệu suất mô hình trên test set',
        nodes: [
            { id: 'testset', name: 'Test Dataset', icon: '📁', type: 'Holdout Set' },
            { id: 'model', name: 'Model', icon: '🧠', type: 'EfficientNet' },
            { id: 'predict', name: 'Predictions', icon: '🔮', type: 'Batch Inference' },
            { id: 'metrics', name: 'Metrics', icon: '📊', type: 'Evaluation' },
            { id: 'report', name: 'Report', icon: '📋', type: 'Summary' }
        ],
        steps: [
            {
                from: 'testset', to: 'testset',
                name: 'Load Test Set',
                description: 'Tải test dataset đã được tách riêng',
                log: 'Test dataset loaded: 300 images, 6 classes',
                data: { numImages: 300, numClasses: 6 }
            },
            {
                from: 'testset', to: 'model',
                name: 'Load Trained Model',
                description: 'Load best model checkpoint cho evaluation',
                log: 'Model loaded: best_model.pt, eval mode',
                data: { checkpoint: 'best_model.pt', mode: 'eval' }
            },
            {
                from: 'model', to: 'predict',
                name: 'Batch Inference',
                description: 'Chạy inference trên toàn bộ test set',
                log: 'Running inference on 300 images...',
                data: { batchSize: 32, totalBatches: 10 }
            },
            {
                from: 'predict', to: 'predict',
                name: 'Collect Predictions',
                description: 'Thu thập predictions và ground truth labels',
                log: 'Predictions collected: 300 samples',
                data: { predictions: 300, groundTruth: 300 }
            },
            {
                from: 'predict', to: 'metrics',
                name: 'Calculate Accuracy',
                description: 'Tính per-label và overall accuracy',
                log: 'Accuracy: overall=0.92, per_label=[0.95, 0.89, 0.91, 0.93, 0.88, 0.94]',
                data: { overallAccuracy: 0.92 }
            },
            {
                from: 'metrics', to: 'metrics',
                name: 'Calculate F1 Score',
                description: 'Tính F1-micro và F1-macro',
                log: 'F1 Score: micro=0.91, macro=0.89',
                data: { f1Micro: 0.91, f1Macro: 0.89 }
            },
            {
                from: 'metrics', to: 'metrics',
                name: 'Calculate mAP',
                description: 'Tính Mean Average Precision',
                log: 'mAP: 0.87 (threshold=0.5)',
                data: { mAP: 0.87, threshold: 0.5 }
            },
            {
                from: 'metrics', to: 'report',
                name: 'Generate Confusion Matrix',
                description: 'Tạo confusion matrix cho từng class',
                log: 'Confusion matrix generated for 6 classes',
                data: { numClasses: 6 }
            },
            {
                from: 'report', to: 'report',
                name: 'Generate Report',
                description: 'Tạo báo cáo đánh giá tổng hợp',
                log: 'Evaluation complete: Accuracy=92%, F1=0.89, mAP=0.87',
                data: { accuracy: 0.92, f1Score: 0.89, mAP: 0.87 }
            }
        ]
    }
};

// ========================================
// Workflow Simulator Class
// ========================================

class WorkflowSimulator {
    constructor() {
        this.currentWorkflow = 'model-training';
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
