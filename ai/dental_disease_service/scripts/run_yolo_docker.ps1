param(
  [string]$DatasetRoot = $(if ($env:DATASET_ROOT) { $env:DATASET_ROOT } else { "D:\DAI_NHAN\roboflow\oral-diseases-5ctay" }),
  [string]$Image = $(if ($env:IMAGE) { $env:IMAGE } else { "smart-medical-intelligent-ledger-for-e-health-smile--kyc-ocr-service:latest" }),
  [string]$Model = $(if ($env:YOLO_MODEL) { $env:YOLO_MODEL } else { "yolo11n.pt" }),
  [int]$Epochs = $(if ($env:EPOCHS) { [int]$env:EPOCHS } else { 30 }),
  [int]$Patience = $(if ($env:PATIENCE) { [int]$env:PATIENCE } else { 7 }),
  [int]$ImageSize = $(if ($env:IMGSZ) { [int]$env:IMGSZ } else { 640 }),
  [int]$Batch = $(if ($env:BATCH) { [int]$env:BATCH } else { 16 }),
  [int]$Workers = $(if ($env:WORKERS) { [int]$env:WORKERS } else { 4 }),
  [string]$RunName = $(if ($env:RUN_NAME) { $env:RUN_NAME } else { "yolo11n_oral_diseases" }),
  [double]$Fraction = $(if ($env:FRACTION) { [double]$env:FRACTION } else { 1.0 }),
  [string]$ShmSize = $(if ($env:SHM_SIZE) { $env:SHM_SIZE } else { "4g" })
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatasetRoot)) {
  Write-Error "DatasetRoot is required."
  exit 1
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$datasetFullPath = Resolve-Path $DatasetRoot

docker run --rm --gpus all `
  --shm-size "$ShmSize" `
  -v "${repoRoot}:/repo" `
  -v "${datasetFullPath}:/data/oral_diseases" `
  -w /repo `
  -e "WORKERS=$Workers" `
  -e "FRACTION=$Fraction" `
  $Image `
  bash ai/dental_disease_service/scripts/run_yolo_train.sh `
    /data/oral_diseases `
    "$Model" `
    "$Epochs" `
    "$Patience" `
    "$ImageSize" `
    "$Batch" `
    "$RunName"
