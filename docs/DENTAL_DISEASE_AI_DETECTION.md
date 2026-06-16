# Dental Disease AI Detection

Last updated: 2026-06-16

## 1. Objective

The dental disease AI module is the current research baseline for detecting visible oral/dental disease regions from RGB oral images. The current implementation is not yet a production API. It is an offline training and evaluation pipeline used to benchmark object detection models before integration into S.M.I.L.E.

The current target is lightweight disease localization, not final clinical diagnosis. Model outputs should be treated as screening or decision-support signals that require clinician review.

## 2. Current Task Definition

| Item | Description |
|---|---|
| Problem type | Object detection |
| Model family | YOLO |
| Current baseline | YOLO11n |
| Input | RGB oral/dental image |
| Output | Bounding boxes, class labels, confidence scores |
| Primary metric | mAP50 and mAP50-95 |
| Current status | Baseline trained and evaluated |

The model detects six disease categories:

| Class ID | Class |
|---:|---|
| 0 | calculus |
| 1 | caries |
| 2 | gingivitis |
| 3 | hypodontia |
| 4 | tooth_discoloration |
| 5 | ulcer |

## 3. Dataset

The current dataset is Roboflow `oral-diseases-5ctay`, version 1.

The dataset is intentionally stored outside the git repository:

```text
D:\DAI_NHAN\roboflow\oral-diseases-5ctay
```

Canonical YOLO data YAML:

```text
D:\DAI_NHAN\roboflow\oral-diseases-5ctay\data_smile.yaml
```

Dataset split summary:

| Split | Images | Labels | Missing Labels | Empty Labels |
|---|---:|---:|---:|---:|
| train | 24,000 | 24,000 | 0 | 3 |
| valid | 1,001 | 1,001 | 0 | 0 |
| test | 999 | 999 | 0 | 0 |

Class distribution:

| Class | Instances |
|---|---:|
| calculus | 24,082 |
| caries | 31,056 |
| gingivitis | 26,533 |
| hypodontia | 6,140 |
| tooth_discoloration | 68,980 |
| ulcer | 9,192 |
| **Total** | **165,983** |

Important dataset notes:

- The dataset contains public Roboflow annotations.
- Labels are useful for engineering and baseline research, but annotation quality should be discussed clearly in academic writing.
- The dataset is imbalanced, especially because `tooth_discoloration` is much larger than `hypodontia` and `ulcer`.
- Empty label files are treated as background images and are valid in YOLO training.

## 4. Repository Structure

Current module path:

```text
ai/dental_disease_service
```

Important files:

| File | Purpose |
|---|---|
| `dental_disease_service/dataset.py` | Dataset YAML generation and YOLO label validation |
| `scripts/download_roboflow_dataset.ps1` | Download dataset from Roboflow using `ROBOFLOW_API_KEY` |
| `scripts/prepare_dataset.py` | Generate and validate `data_smile.yaml` |
| `scripts/train_yolo.py` | Local YOLO training entrypoint |
| `scripts/run_yolo_docker.ps1` | Docker YOLO training wrapper |
| `scripts/run_yolo_overnight.ps1` | Background/overnight Docker training runner |
| `scripts/evaluate_yolo.py` | Local YOLO evaluation entrypoint |
| `scripts/evaluate_yolo_docker.ps1` | Docker YOLO evaluation wrapper |
| `reports/yolo11n_baseline_results.md` | Current baseline result report |
| `tests/test_dataset.py` | Unit tests for dataset validation behavior |

Generated artifacts are intentionally ignored:

| Artifact | Reason |
|---|---|
| `runs/` | Training outputs, plots, labels cache, predictions |
| `*.pt` | PyTorch model weights |
| `*.onnx` | Exported model weights |
| downloaded dataset folders | Large external data |

## 5. Baseline Model

Current baseline:

| Field | Value |
|---|---|
| Model | `yolo11n.pt` |
| Variant | Nano |
| Reason | Lightweight baseline suitable for 4GB VRAM |
| Epochs | 30 |
| Image size | 640 |
| Batch size | 16 |
| Workers | 4 |
| Device used | NVIDIA GeForce RTX 3050 Laptop GPU, 4096 MiB |
| Training time | 4.031 hours |
| Best weights | `runs\dental_detection\yolo11n_oral_diseases_b16_e30\weights\best.pt` |

Why YOLO11n was chosen first:

- It fits comfortably on the available 4GB GPU.
- It trains within a reasonable overnight/demo timeframe.
- It gives a practical lower-bound benchmark for future larger models.
- Its inference speed is suitable for future real-time or near-real-time demo use.

## 6. Training Pipeline

### 6.1 Prepare Dataset

```powershell
python ai\dental_disease_service\scripts\prepare_dataset.py `
  --dataset-root D:\DAI_NHAN\roboflow\oral-diseases-5ctay
```

This step:

- Writes `data_smile.yaml`.
- Verifies train/valid/test image and label counts.
- Checks missing label files.
- Checks invalid YOLO label rows.
- Reports class distribution.

### 6.2 Train with Docker

Recommended training command:

```powershell
.\ai\dental_disease_service\scripts\run_yolo_overnight.ps1 `
  -DatasetRoot D:\DAI_NHAN\roboflow\oral-diseases-5ctay `
  -RunName yolo11n_oral_diseases_b16_e30 `
  -Epochs 30 `
  -Patience 7 `
  -Batch 16 `
  -Workers 4
```

The overnight runner:

- Starts training in a background PowerShell process.
- Runs YOLO inside Docker.
- Mounts the dataset into the container.
- Writes logs under `runs\dental_detection\logs`.
- Uses Docker shared memory to avoid PyTorch dataloader shared-memory errors.

Follow log:

```powershell
Get-Content .\runs\dental_detection\logs\yolo11n_oral_diseases_b16_e30.out.log -Wait
```

Stop training:

```powershell
docker ps
docker stop <container_id_or_name>
```

## 7. Evaluation Pipeline

Local evaluation requires `ultralytics` in the active Python environment. If local Python does not have it installed, use Docker evaluation.

Recommended Docker evaluation command:

```powershell
.\ai\dental_disease_service\scripts\evaluate_yolo_docker.ps1 `
  -DatasetRoot D:\DAI_NHAN\roboflow\oral-diseases-5ctay `
  -Weights runs\dental_detection\yolo11n_oral_diseases_b16_e30\weights\best.pt `
  -Split test `
  -Batch 16
```

This command:

- Mounts the repository into `/repo`.
- Mounts the dataset into `/data/oral_diseases`.
- Creates a temporary YAML inside the container.
- Evaluates `best.pt` on the requested split.
- Prints per-class metrics to console.

## 8. Current Baseline Results

### 8.1 Validation Result

Final validation metrics at epoch 30:

| Split | Images | Instances | Precision | Recall | mAP50 | mAP50-95 |
|---|---:|---:|---:|---:|---:|---:|
| valid | 1,001 | 6,331 | 0.729 | 0.735 | 0.775 | 0.391 |

Final training row:

| Epoch | Train Box Loss | Train Cls Loss | Train DFL Loss | Precision | Recall | mAP50 | mAP50-95 | Val Box Loss | Val Cls Loss | Val DFL Loss |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 30 | 1.50047 | 0.95433 | 1.42702 | 0.72902 | 0.73459 | 0.77543 | 0.39061 | 1.57283 | 0.94680 | 1.39396 |

### 8.2 Test Result

| Class | Images | Instances | Precision | Recall | mAP50 | mAP50-95 |
|---|---:|---:|---:|---:|---:|---:|
| all | 999 | 6,422 | 0.745 | 0.744 | 0.792 | 0.407 |
| calculus | 203 | 816 | 0.662 | 0.582 | 0.646 | 0.306 |
| caries | 370 | 1,156 | 0.788 | 0.806 | 0.853 | 0.445 |
| gingivitis | 217 | 1,115 | 0.709 | 0.515 | 0.606 | 0.275 |
| hypodontia | 143 | 260 | 0.738 | 0.796 | 0.837 | 0.362 |
| tooth_discoloration | 429 | 2,725 | 0.707 | 0.854 | 0.864 | 0.551 |
| ulcer | 184 | 350 | 0.867 | 0.911 | 0.944 | 0.504 |

Inference speed on test split:

| Stage | Time Per Image |
|---|---:|
| Preprocess | 1.1 ms |
| Inference | 4.9 ms |
| Loss | 0.0 ms |
| Postprocess | 3.9 ms |

Raw metric summary:

```json
{
  "split": "test",
  "box_map": 0.4072390429887602,
  "box_map50": 0.7917787979388736,
  "box_map75": 0.37306240059235435,
  "box_maps": [
    0.3060618636289557,
    0.44511726868115087,
    0.2752713076673327,
    0.36170122823423767,
    0.5510899093868462,
    0.5041926803340375
  ]
}
```

## 9. Baseline Assessment

The current YOLO11n baseline is acceptable as the first official benchmark.

Strengths:

- Overall test `mAP50 = 0.792`, which is strong for a lightweight nano model.
- Precision and recall are balanced at approximately `0.745`.
- `ulcer`, `tooth_discoloration`, and `caries` perform well.
- Inference is fast enough for future interactive demo workflows.
- Training completed in about 4 hours on a 4GB laptop GPU.

Weaknesses:

- `mAP50-95 = 0.407` indicates that strict localization quality still needs improvement.
- `gingivitis` has weak recall (`0.515`) and low `mAP50-95` (`0.275`).
- `calculus` also has low recall (`0.582`) and low `mAP50-95` (`0.306`).
- Dataset imbalance may bias performance toward classes with many instances.
- Public dataset label quality should be acknowledged in any research report.

Interpretation:

- The model can detect many disease regions at moderate IoU thresholds.
- The model is not yet strong enough to be presented as a clinical-grade diagnostic model.
- The module should currently be framed as a lightweight detection baseline and explainable screening component.

## 10. Recommended Next Experiments

1. Train `yolo11s.pt` with the same data split and compare against YOLO11n.
2. Export per-class PR curves and confusion matrix into the report.
3. Generate sample predictions for each class.
4. Review false negatives for `gingivitis` and `calculus`.
5. Compare performance across image quality levels if metadata can be derived.
6. Try class-focused augmentation or error analysis before changing model architecture.
7. Consider ONNX export only after selecting the best baseline.

## 11. Suggested Report Framing

For academic writing, this module should be framed carefully:

- The contribution is a lightweight object-detection baseline and pipeline for dental disease localization.
- The dataset is public and externally annotated, so annotation quality is a limitation.
- The model provides decision support and visual localization, not autonomous diagnosis.
- Future clinician validation is required before any clinical use.

Suggested wording:

> We develop and evaluate a lightweight YOLO-based dental disease localization baseline using public bounding-box annotations. The model is intended for screening support and system integration experiments, while clinical validity requires future expert-reviewed datasets and prospective validation.

## 12. Current Files to Keep Out of Git

Do not commit:

- `D:\DAI_NHAN\roboflow\oral-diseases-5ctay`
- `runs/`
- `*.pt`
- `*.onnx`
- prediction images
- debug overlays
- private patient or clinical images

Commit only:

- scripts
- validators
- README/report Markdown files
- lightweight tests
