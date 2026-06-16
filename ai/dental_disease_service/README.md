# Dental Disease Detection Baseline

This service folder contains the research baseline for dental disease object
detection using the Roboflow oral diseases dataset.

Dataset is intentionally kept outside the repository:

```text
D:\DAI_NHAN\roboflow\oral-diseases-5ctay
```

Use the canonical YAML generated for local training:

```text
D:\DAI_NHAN\roboflow\oral-diseases-5ctay\data_smile.yaml
```

## Dataset

Classes:

1. `calculus`
2. `caries`
3. `gingivitis`
4. `hypodontia`
5. `tooth_discoloration`
6. `ulcer`

Prepare or refresh the YAML:

```powershell
python ai\dental_disease_service\scripts\prepare_dataset.py `
  --dataset-root D:\DAI_NHAN\roboflow\oral-diseases-5ctay
```

## Train

Quick smoke run:

```powershell
python ai\dental_disease_service\scripts\train_yolo.py `
  --data-yaml D:\DAI_NHAN\roboflow\oral-diseases-5ctay\data_smile.yaml `
  --epochs 1 `
  --batch 8 `
  --workers 2 `
  --name smoke
```

Overnight Docker run:

```powershell
.\ai\dental_disease_service\scripts\run_yolo_overnight.ps1 `
  -DatasetRoot D:\DAI_NHAN\roboflow\oral-diseases-5ctay `
  -RunName yolo11n_oral_diseases_b16_e30 `
  -Epochs 30 `
  -Patience 7 `
  -Batch 16 `
  -Workers 4
```

## Evaluate

```powershell
python ai\dental_disease_service\scripts\evaluate_yolo.py `
  --weights runs\dental_detection\your_run\weights\best.pt `
  --data-yaml D:\DAI_NHAN\roboflow\oral-diseases-5ctay\data_smile.yaml
```

Model weights, runs, downloaded datasets, and debug artifacts must stay out of
git.
