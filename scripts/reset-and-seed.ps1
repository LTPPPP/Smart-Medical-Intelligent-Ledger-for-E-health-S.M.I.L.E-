[CmdletBinding()]
param(
  [switch]$ConfirmReset,
  [string]$PostgresContainer = 'smile-postgres'
)

$ErrorActionPreference = 'Stop'

if (-not $ConfirmReset) {
  throw 'This command recreates five local databases. Re-run with -ConfirmReset.'
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$iamDirectory = Join-Path $repoRoot 'backend\service\iam-service'
$clinicalDirectory = Join-Path $repoRoot 'backend\service\clinical-emr-service'
$paymentDirectory = Join-Path $repoRoot 'backend\service\payment-service'

$databases = @(
  'auth_service_db',
  'account_service_db',
  'core_clinic_service_db',
  'core_medical_service_db',
  'payment_service_db'
)

$applicationContainers = @(
  'smile-gateway',
  'smile-payment-service',
  'smile-clinical-emr-service',
  'smile-iam-service'
)

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory)]
    [string]$WorkingDirectory,
    [Parameter(Mandatory)]
    [string]$Executable,
    [Parameter(Mandatory)]
    [string[]]$Arguments
  )

  Push-Location -LiteralPath $WorkingDirectory
  try {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code $LASTEXITCODE`: $Executable"
    }
  } finally {
    Pop-Location
  }
}

function Invoke-TsNode {
  param(
    [Parameter(Mandatory)]
    [string]$ServiceDirectory,
    [Parameter(Mandatory)]
    [string[]]$Arguments
  )

  $executable = Join-Path $ServiceDirectory 'node_modules\.bin\ts-node.cmd'
  if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
    throw "Dependencies are unavailable in $ServiceDirectory. Install them before resetting."
  }
  Invoke-CheckedCommand -WorkingDirectory $ServiceDirectory -Executable $executable -Arguments $Arguments
}

function Invoke-PostgresAdmin {
  param(
    [Parameter(Mandatory)]
    [string]$Sql
  )

  & docker exec $PostgresContainer psql `
    -U postgres `
    -d postgres `
    -v ON_ERROR_STOP=1 `
    -c $Sql
  if ($LASTEXITCODE -ne 0) {
    throw 'PostgreSQL administrative command failed.'
  }
}

function Wait-ForHttp {
  param(
    [Parameter(Mandatory)]
    [string]$Name,
    [Parameter(Mandatory)]
    [string]$Uri
  )

  for ($attempt = 1; $attempt -le 30; $attempt += 1) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Uri -TimeoutSec 4
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        Write-Output "$Name is ready."
        return
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  throw "$Name did not become ready at $Uri."
}

function Set-LocalDatabaseEnvironment {
  $env:DATABASE_TYPE = 'postgres'
  $env:DATABASE_HOST = '127.0.0.1'
  $env:DATABASE_PORT = '5432'
  $env:DATABASE_USERNAME = 'postgres'
  $env:DATABASE_PASSWORD = 'postgres'
  $env:DATABASE_SYNCHRONIZE = 'false'
  $env:DATABASE_SSL_ENABLED = 'false'

  $env:USER_DATABASE_HOST = '127.0.0.1'
  $env:USER_DATABASE_PORT = '5432'
  $env:USER_DATABASE_USERNAME = 'postgres'
  $env:USER_DATABASE_PASSWORD = 'postgres'
  $env:USER_DATABASE_SYNCHRONIZE = 'false'

  $env:CLINIC_DATABASE_HOST = '127.0.0.1'
  $env:CLINIC_DATABASE_PORT = '5432'
  $env:CLINIC_DATABASE_USERNAME = 'postgres'
  $env:CLINIC_DATABASE_PASSWORD = 'postgres'
  $env:CLINIC_DATABASE_SYNCHRONIZE = 'false'

  $env:CLINICAL_DATABASE_HOST = '127.0.0.1'
  $env:CLINICAL_DATABASE_PORT = '5432'
  $env:CLINICAL_DATABASE_USERNAME = 'postgres'
  $env:CLINICAL_DATABASE_PASSWORD = 'postgres'
}

function Invoke-Migrations {
  Write-Output 'Applying IAM migrations...'
  $env:DATABASE_NAME = 'auth_service_db'
  $env:USER_DATABASE_NAME = 'account_service_db'
  Invoke-TsNode -ServiceDirectory $iamDirectory -Arguments @(
    '-r',
    'tsconfig-paths/register',
    './node_modules/typeorm/cli.js',
    '-d',
    'src/database/data-source.ts',
    'migration:run'
  )
  Invoke-TsNode -ServiceDirectory $iamDirectory -Arguments @(
    '-r',
    'tsconfig-paths/register',
    './node_modules/typeorm/cli.js',
    '-d',
    'src/database/user-data-source.ts',
    'migration:run'
  )

  Write-Output 'Applying Clinical EMR migrations...'
  $env:DATABASE_NAME = 'core_medical_service_db'
  $env:CLINIC_DATABASE_NAME = 'core_clinic_service_db'
  Invoke-TsNode -ServiceDirectory $clinicalDirectory -Arguments @(
    '-r',
    'tsconfig-paths/register',
    './node_modules/typeorm/cli.js',
    '-d',
    'src/database/data-source.ts',
    'migration:run'
  )
  Invoke-TsNode -ServiceDirectory $clinicalDirectory -Arguments @(
    '-r',
    'tsconfig-paths/register',
    './node_modules/typeorm/cli.js',
    '-d',
    'src/database/clinic-data-source.ts',
    'migration:run'
  )

  Write-Output 'Applying Payment migrations...'
  $env:DATABASE_NAME = 'payment_service_db'
  $env:CLINICAL_DATABASE_NAME = 'core_clinic_service_db'
  Invoke-TsNode -ServiceDirectory $paymentDirectory -Arguments @(
    '-r',
    'tsconfig-paths/register',
    './node_modules/typeorm/cli.js',
    '-d',
    'src/database/data-source.ts',
    'migration:run'
  )
}

function Invoke-CanonicalSeeds {
  param(
    [Parameter(Mandatory)]
    [int]$Pass
  )

  Write-Output "Running canonical seed pass $Pass..."

  $env:DATABASE_NAME = 'auth_service_db'
  $env:USER_DATABASE_NAME = 'account_service_db'
  Invoke-TsNode -ServiceDirectory $iamDirectory -Arguments @(
    '-r',
    'tsconfig-paths/register',
    './src/database/seeds/relational/run-seed.ts'
  )
  Invoke-TsNode -ServiceDirectory $iamDirectory -Arguments @(
    '-r',
    'tsconfig-paths/register',
    './src/database/seeds/relational/user-service/run-user-seed.ts'
  )

  $env:DATABASE_NAME = 'core_medical_service_db'
  $env:CLINIC_DATABASE_NAME = 'core_clinic_service_db'
  Invoke-TsNode -ServiceDirectory $clinicalDirectory -Arguments @(
    '-r',
    'tsconfig-paths/register',
    './src/database/seeds/relational/clinic/run-clinic-seed.ts'
  )

  $env:DATABASE_NAME = 'payment_service_db'
  $env:CLINICAL_DATABASE_NAME = 'core_clinic_service_db'
  Invoke-TsNode -ServiceDirectory $paymentDirectory -Arguments @(
    '-r',
    'tsconfig-paths/register',
    './src/database/seeds/run-seed.ts'
  )
}

function Start-ApplicationContainers {
  & docker start `
    smile-iam-service `
    smile-clinical-emr-service `
    smile-payment-service `
    smile-gateway | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to restart one or more application containers.'
  }
}

$postgresRunning = (& docker inspect -f '{{.State.Running}}' $PostgresContainer 2>$null) -eq 'true'
if (-not $postgresRunning) {
  throw "Required PostgreSQL container is not running: $PostgresContainer"
}

$knownContainers = @(& docker ps -a --format '{{.Names}}')
foreach ($container in $applicationContainers) {
  if ($knownContainers -notcontains $container) {
    throw "Required application container is unavailable: $container"
  }
}

Set-LocalDatabaseEnvironment
$resetSucceeded = $false

try {
  Write-Output 'Stopping application containers...'
  & docker stop @applicationContainers | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to stop one or more application containers.'
  }

  foreach ($database in $databases) {
    Write-Output "Recreating $database..."
    Invoke-PostgresAdmin -Sql "DROP DATABASE IF EXISTS `"$database`" WITH (FORCE);"
    Invoke-PostgresAdmin -Sql "CREATE DATABASE `"$database`";"
  }

  Invoke-Migrations
  Invoke-CanonicalSeeds -Pass 1
  Invoke-CanonicalSeeds -Pass 2
  $resetSucceeded = $true
} finally {
  Write-Output 'Starting application containers...'
  Start-ApplicationContainers
}

if (-not $resetSucceeded) {
  throw 'Database reset did not complete.'
}

Wait-ForHttp -Name 'IAM service' -Uri 'http://localhost:8081/v1/health'
Wait-ForHttp -Name 'Clinical EMR service' -Uri 'http://localhost:8082/api/v1/health'
Wait-ForHttp -Name 'Payment service' -Uri 'http://localhost:3006/api/v1/health'
Wait-ForHttp -Name 'Gateway' -Uri 'http://localhost:8088/health'

Write-Output 'Five local databases were recreated and seeded twice successfully.'
