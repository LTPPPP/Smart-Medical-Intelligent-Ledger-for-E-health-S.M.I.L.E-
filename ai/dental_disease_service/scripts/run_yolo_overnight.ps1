param(
  [string]$DatasetRoot = $(if ($env:DATASET_ROOT) { $env:DATASET_ROOT } else { "D:\DAI_NHAN\roboflow\oral-diseases-5ctay" }),
  [string]$RunName = $(if ($env:RUN_NAME) { $env:RUN_NAME } else { "yolo11n_oral_diseases_$(Get-Date -Format yyyyMMdd_HHmmss)" }),
  [string]$Model = $(if ($env:YOLO_MODEL) { $env:YOLO_MODEL } else { "yolo11n.pt" }),
  [int]$Epochs = $(if ($env:EPOCHS) { [int]$env:EPOCHS } else { 30 }),
  [int]$Patience = $(if ($env:PATIENCE) { [int]$env:PATIENCE } else { 7 }),
  [int]$ImageSize = $(if ($env:IMGSZ) { [int]$env:IMGSZ } else { 640 }),
  [int]$Batch = $(if ($env:BATCH) { [int]$env:BATCH } else { 16 }),
  [int]$Workers = $(if ($env:WORKERS) { [int]$env:WORKERS } else { 4 })
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$logRoot = Join-Path $repoRoot "runs\dental_detection\logs"
New-Item -ItemType Directory -Force $logRoot | Out-Null
$outLogPath = Join-Path $logRoot "$RunName.out.log"
$errLogPath = Join-Path $logRoot "$RunName.err.log"

$argsList = @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", (Join-Path $PSScriptRoot "run_yolo_docker.ps1"),
  "-DatasetRoot", $DatasetRoot,
  "-RunName", $RunName,
  "-Model", $Model,
  "-Epochs", "$Epochs",
  "-Patience", "$Patience",
  "-ImageSize", "$ImageSize",
  "-Batch", "$Batch",
  "-Workers", "$Workers"
)

$process = Start-Process -FilePath "powershell" -ArgumentList $argsList -RedirectStandardOutput $outLogPath -RedirectStandardError $errLogPath -PassThru -WindowStyle Hidden
Write-Host "Started YOLO training PID: $($process.Id)"
Write-Host "Run name: $RunName"
Write-Host "Output log: $outLogPath"
Write-Host "Error log: $errLogPath"
Write-Host "Follow log:"
Write-Host "Get-Content `"$outLogPath`" -Wait"
