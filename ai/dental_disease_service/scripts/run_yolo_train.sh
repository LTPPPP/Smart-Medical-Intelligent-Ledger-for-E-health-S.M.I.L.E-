#!/usr/bin/env bash
set -euo pipefail

DATASET_ROOT="${1:-${DATASET_ROOT:-/data/oral_diseases}}"
MODEL="${2:-${YOLO_MODEL:-yolo11n.pt}}"
EPOCHS="${3:-${EPOCHS:-30}}"
PATIENCE="${4:-${PATIENCE:-7}}"
IMGSZ="${5:-${IMGSZ:-640}}"
BATCH="${6:-${BATCH:-16}}"
RUN_NAME="${7:-${RUN_NAME:-yolo11n_oral_diseases}}"
WORKERS="${WORKERS:-4}"
FRACTION="${FRACTION:-1.0}"
DATA_YAML="${DATA_YAML:-/tmp/oral_diseases_data.yaml}"

export PYTHONPATH="/repo/ai/dental_disease_service:${PYTHONPATH:-}"

python /repo/ai/dental_disease_service/scripts/prepare_dataset.py \
  --dataset-root "$DATASET_ROOT" \
  --output "$DATA_YAML" \
  --skip-validate

python /repo/ai/dental_disease_service/scripts/train_yolo.py \
  --data-yaml "$DATA_YAML" \
  --model "$MODEL" \
  --epochs "$EPOCHS" \
  --patience "$PATIENCE" \
  --imgsz "$IMGSZ" \
  --batch "$BATCH" \
  --workers "$WORKERS" \
  --project /repo/runs/dental_detection \
  --name "$RUN_NAME" \
  --fraction "$FRACTION" \
  --skip-validate
