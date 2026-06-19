# Swagger Request Examples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure Clinical/EMR and IAM Swagger request bodies expose editable DTO fields across the API.

**Architecture:** Enable the official NestJS Swagger compiler plugin in both services so DTO schemas are generated from TypeScript and validation metadata. Preserve explicit decorators already present for richer examples.

**Tech Stack:** NestJS, `@nestjs/swagger`, Docker Compose, PowerShell verification commands.

---

### Task 1: Enable Swagger Plugin

**Files:**
- Modify: `backend/service/clinical-emr-service/nest-cli.json`
- Modify: `backend/service/iam-service/nest-cli.json`

- [ ] **Step 1: Add the plugin to Clinical/EMR**

Update `compilerOptions` to include:

```json
"plugins": [
  {
    "name": "@nestjs/swagger",
    "options": {
      "classValidatorShim": true,
      "introspectComments": true
    }
  }
]
```

- [ ] **Step 2: Add the same plugin to IAM**

Use the same `plugins` block in `backend/service/iam-service/nest-cli.json`, keeping `deleteOutDir: true`.

- [ ] **Step 3: Validate JSON**

Run:

```powershell
Get-Content backend\service\clinical-emr-service\nest-cli.json | ConvertFrom-Json | Out-Null
Get-Content backend\service\iam-service\nest-cli.json | ConvertFrom-Json | Out-Null
```

Expected: no JSON parse errors.

### Task 2: Build And Restart Services

**Files:**
- No source files modified.

- [ ] **Step 1: Build Clinical/EMR**

Run:

```powershell
docker compose -f docker-compose.swagger.yaml exec -T clinical-emr-service npm run build
```

Expected: build exits with code 0.

- [ ] **Step 2: Build IAM**

Run:

```powershell
docker compose -f docker-compose.swagger.yaml exec -T iam-service npm run build
```

Expected: build exits with code 0.

- [ ] **Step 3: Restart the services**

Run:

```powershell
docker compose -f docker-compose.swagger.yaml restart clinical-emr-service iam-service
```

Expected: both containers return to `Up`.

### Task 3: Verify Swagger Schemas

**Files:**
- No source files modified.

- [ ] **Step 1: Refresh gateway Swagger**

Run:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/swagger/refresh -TimeoutSec 40
```

Expected: response has `status: ok`.

- [ ] **Step 2: Check Clinical DTO schemas**

Run a script that checks representative schemas:

```powershell
$clinical = Invoke-RestMethod -Uri http://localhost:3004/docs-json -TimeoutSec 20
@("CreatePatientDto","CreateMedicalRecordDto","CreatePrescriptionDto","CreateDentalImageDto","CreateTreatmentPlanDto") |
  ForEach-Object {
    $schema = $clinical.components.schemas.$_
    if (-not $schema -or -not $schema.properties -or $schema.properties.PSObject.Properties.Count -eq 0) {
      throw "Clinical schema missing properties: $_"
    }
  }
```

Expected: no exception.

- [ ] **Step 3: Check IAM DTO schemas**

Run:

```powershell
$iam = Invoke-RestMethod -Uri http://localhost:3001/docs-json -TimeoutSec 20
@("AuthEmailLoginDto","CreateAccountDto","CreateRoleDto","CreatePermissionDto","CreateNotificationDto") |
  ForEach-Object {
    $schema = $iam.components.schemas.$_
    if (-not $schema -or -not $schema.properties -or $schema.properties.PSObject.Properties.Count -eq 0) {
      throw "IAM schema missing properties: $_"
    }
  }
```

Expected: no exception.

### Task 4: Smoke Test Interactive Endpoints

**Files:**
- No source files modified.

- [ ] **Step 1: Verify patient list**

Run:

```powershell
Invoke-RestMethod -Uri http://localhost:3004/api/patients -Headers @{ "x-custom-lang" = "en" } -TimeoutSec 20
```

Expected: HTTP 200 with an array response.

- [ ] **Step 2: Verify IAM login**

Run:

```powershell
$body = @{ email = "admin@smile.com"; password = "12345678" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri http://localhost:3001/v1/auth/email/login -Method Post -ContentType "application/json" -Body $body -TimeoutSec 20
if (-not $login.token) { throw "Login did not return token" }
```

Expected: token is present.
