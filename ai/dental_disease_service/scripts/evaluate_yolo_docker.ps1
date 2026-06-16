param(
  [string]$DatasetRoot = $(if ($env:DATASET_ROOT) { $env:DATASET_ROOT } else { "D:\DAI_NHAN\roboflow\oral-diseases-5ctay" }),
  [string]$Weights = "runs\dental_detection\yolo11n_oral_diseases_b16_e30\weights\best.pt",
  [string]$Image = $(if ($env:IMAGE) { $env:IMAGE } else { "smart-medical-intelligent-ledger-for-e-health-smile--kyc-ocr-service:latest" }),
  [int]$ImageSize = $(if ($env:IMGSZ) { [int]$env:IMGSZ } else { 640 }),
  [int]$Batch = $(if ($env:BATCH) { [int]$env:BATCH } else { 16 }),
  [string]$Split = $(if ($env:SPLIT) { $env:SPLIT } else { "test" }),
  [string]$ShmSize = $(if ($env:SHM_SIZE) { $env:SHM_SIZE } else { "4g" })
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatasetRoot)) {
  Write-Error "DatasetRoot is required."
  exit 1
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$datasetFullPath = Resolve-Path $DatasetRoot
$weightsFullPath = Resolve-Path (Join-Path $repoRoot $Weights)
$weightsInContainer = "/repo/" + ($weightsFullPath.Path.Substring($repoRoot.Path.Length).TrimStart("\") -replace "\\", "/")

docker run --rm --gpus all `
  --shm-size "$ShmSize" `
  -v "${repoRoot}:/repo" `
  -v "${datasetFullPath}:/data/oral_diseases" `
  -w /repo `
  $Image `
  bash -lc "python /repo/ai/dental_disease_service/scripts/prepare_dataset.py --dataset-root /data/oral_diseases --output /tmp/oral_diseases_data.yaml --skip-validate && python /repo/ai/dental_disease_service/scripts/evaluate_yolo.py --weights '$weightsInContainer' --data-yaml /tmp/oral_diseases_data.yaml --split '$Split' --imgsz '$ImageSize' --batch '$Batch' --skip-validate"
