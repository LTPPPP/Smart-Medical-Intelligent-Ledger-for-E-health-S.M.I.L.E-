# YOLO11n Dental Disease Baseline Results

## Run Summary

| Field | Value |
|---|---|
| Run name | `yolo11n_oral_diseases_b16_e30` |
| Model | `yolo11n.pt` |
| Task | Object detection |
| Dataset | Roboflow `oral-diseases-5ctay`, version 1 |
| Dataset root | `D:\DAI_NHAN\roboflow\oral-diseases-5ctay` |
| Data YAML | `D:\DAI_NHAN\roboflow\oral-diseases-5ctay\data_smile.yaml` |
| Classes | calculus, caries, gingivitis, hypodontia, tooth_discoloration, ulcer |
| Epochs | 30 |
| Image size | 640 |
| Batch size | 16 |
| Workers | 4 |
| Device | NVIDIA GeForce RTX 3050 Laptop GPU, 4096 MiB |
| Training time | 4.031 hours |
| Best weights | `runs\dental_detection\yolo11n_oral_diseases_b16_e30\weights\best.pt` |
| Last weights | `runs\dental_detection\yolo11n_oral_diseases_b16_e30\weights\last.pt` |

## Dataset Validation

| Split | Images | Labels | Missing Labels | Empty Labels |
|---|---:|---:|---:|---:|
| train | 24,000 | 24,000 | 0 | 3 |
| valid | 1,001 | 1,001 | 0 | 0 |
| test | 999 | 999 | 0 | 0 |

## Dataset Class Distribution

| Class | Instances |
|---|---:|
| calculus | 24,082 |
| caries | 31,056 |
| gingivitis | 26,533 |
| hypodontia | 6,140 |
| tooth_discoloration | 68,980 |
| ulcer | 9,192 |
| **Total** | **165,983** |

## Training Validation Metrics

Final validation metrics reported at the end of epoch 30 on the validation split:

| Split | Images | Instances | Precision | Recall | mAP50 | mAP50-95 |
|---|---:|---:|---:|---:|---:|---:|
| valid | 1,001 | 6,331 | 0.729 | 0.735 | 0.775 | 0.391 |

Final row from `results.csv`:

| Epoch | Train Box Loss | Train Cls Loss | Train DFL Loss | Precision | Recall | mAP50 | mAP50-95 | Val Box Loss | Val Cls Loss | Val DFL Loss |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 30 | 1.50047 | 0.95433 | 1.42702 | 0.72902 | 0.73459 | 0.77543 | 0.39061 | 1.57283 | 0.94680 | 1.39396 |

## Test Evaluation Metrics

Evaluation command:

```powershell
.\ai\dental_disease_service\scripts\evaluate_yolo_docker.ps1 `
  -DatasetRoot D:\DAI_NHAN\roboflow\oral-diseases-5ctay `
  -Weights runs\dental_detection\yolo11n_oral_diseases_b16_e30\weights\best.pt `
  -Split test `
  -Batch 16
```

| Class | Images | Instances | Precision | Recall | mAP50 | mAP50-95 |
|---|---:|---:|---:|---:|---:|---:|
| all | 999 | 6,422 | 0.745 | 0.744 | 0.792 | 0.407 |
| calculus | 203 | 816 | 0.662 | 0.582 | 0.646 | 0.306 |
| caries | 370 | 1,156 | 0.788 | 0.806 | 0.853 | 0.445 |
| gingivitis | 217 | 1,115 | 0.709 | 0.515 | 0.606 | 0.275 |
| hypodontia | 143 | 260 | 0.738 | 0.796 | 0.837 | 0.362 |
| tooth_discoloration | 429 | 2,725 | 0.707 | 0.854 | 0.864 | 0.551 |
| ulcer | 184 | 350 | 0.867 | 0.911 | 0.944 | 0.504 |

Raw JSON summary:

```json
{
  "weights": "/repo/runs/dental_detection/yolo11n_oral_diseases_b16_e30/weights/best.pt",
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

## Inference Speed

Measured on the test split:

| Stage | Time Per Image |
|---|---:|
| Preprocess | 1.1 ms |
| Inference | 4.9 ms |
| Loss | 0.0 ms |
| Postprocess | 3.9 ms |

## Notes

- YOLO11n provides a strong lightweight baseline with test `mAP50 = 0.792` and `mAP50-95 = 0.407`.
- Best classes by `mAP50` are `ulcer`, `tooth_discoloration`, and `caries`.
- Weakest classes are `gingivitis` and `calculus`, mainly due to lower recall and lower strict-IoU localization quality.
- The large class imbalance is visible: `tooth_discoloration` has 68,980 instances while `hypodontia` has 6,140 instances.
- Future runs should compare `yolo11n.pt` against `yolo11s.pt` and consider augmentation or class-aware sampling/analysis for weaker classes.
