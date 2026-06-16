param(
  [string]$OutputDir = $(if ($env:DATASET_ROOT) { $env:DATASET_ROOT } else { "D:\DAI_NHAN\roboflow\oral-diseases-5ctay" }),
  [string]$Workspace = "gilang-pappa-tanto-pambua",
  [string]$Project = "oral-diseases-5ctay",
  [int]$Version = 1,
  [string]$Format = "yolov8"
)

$ErrorActionPreference = "Stop"

$apiKey = $env:ROBOFLOW_API_KEY
if ([string]::IsNullOrWhiteSpace($apiKey)) {
  $apiKey = [Environment]::GetEnvironmentVariable("ROBOFLOW_API_KEY", "User")
}
if ([string]::IsNullOrWhiteSpace($apiKey)) {
  Write-Error "ROBOFLOW_API_KEY is required. Set it in env or User environment."
  exit 1
}

New-Item -ItemType Directory -Force (Split-Path $OutputDir) | Out-Null

$env:ROBOFLOW_API_KEY = $apiKey
@"
import os
from roboflow import Roboflow

rf = Roboflow(api_key=os.environ["ROBOFLOW_API_KEY"])
project = rf.workspace("$Workspace").project("$Project")
dataset = project.version($Version).download("$Format", location=r"$OutputDir", overwrite=True)
print(f"DOWNLOADED_TO={dataset.location}")
"@ | python -
