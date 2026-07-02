---
applyTo: "**"
---

# 🔒 Security Rules — S.M.I.L.E

> Applies to all layers: Frontend, Backend, AI Service.

---

## 1. Secrets & Credentials

- **NEVER** hardcode secrets, API keys, passwords, or tokens in source code.
- **NEVER** commit `.env` files — only `.env.example` with placeholder values.
- All secrets must be injected via environment variables or a secrets manager (Vault, AWS Secrets Manager).
- Rotate credentials immediately if accidentally exposed.
- Pre-commit hook must run `gitleaks` / `trufflehog` to prevent secret leakage.

```bash
# ✅ CORRECT
DB_PASSWORD=${DB_PASSWORD}

# ❌ WRONG
DB_PASSWORD=myS3cretP@ss
```

---

## 2. Authentication & Authorisation

### JWT Rules

- Tokens must be signed with **RS256** (asymmetric) — never HS256 in production.
- Access token expiry: **15 minutes**. Refresh token expiry: **7 days**.
- Refresh tokens must be stored server-side (Redis) and rotated on each use.
- Never store access tokens in `localStorage` — use `httpOnly` cookies or in-memory.
- Validate `iss`, `aud`, `exp`, `nbf` claims on every token.

### Role-Based Access Control (RBAC)

| Role           | Access                                                |
| -------------- | ----------------------------------------------------- |
| `PATIENT`      | Own records, own appointments, own consent            |
| `DENTIST`      | Clinic patients' records (with consent), appointments |
| `CLINIC_ADMIN` | Clinic-scoped management, staff management            |
| `SUPER_ADMIN`  | Platform-wide (audit only, no medical data)           |

- Every `@PreAuthorize` annotation must reference a role from this table.
- Horizontal privilege escalation checks: `patient.id == currentUser.id` must be enforced explicitly.

```java
// ✅ CORRECT — checks both role and ownership
@PreAuthorize("hasRole('PATIENT') and #patientId == authentication.name")
public MedicalRecordResponse getRecord(@PathVariable String patientId) { ... }

// ❌ WRONG — role only, no ownership check
@PreAuthorize("hasRole('PATIENT')")
public MedicalRecordResponse getRecord(@PathVariable String patientId) { ... }
```

---

## 3. Input Validation & Sanitisation

- **All external inputs** (path params, query params, request body, headers) must be validated before use.
- Use Bean Validation annotations (`@NotNull`, `@Size`, `@Pattern`, `@Email`) on all DTO fields.
- Reject unknown fields with `@JsonIgnoreProperties(ignoreUnknown = false)` (or configure tightly).
- **SQL injection**: always use parameterized queries / JPA — never string-concatenated SQL.
- **XSS (Frontend)**: sanitize any user-generated HTML with DOMPurify before rendering.
- **Path traversal**: reject path segments containing `..` or null bytes.

```java
public record AppointmentRequest(
    @NotBlank @Size(max = 36) String patientId,
    @Future @NotNull LocalDateTime scheduledAt,
    @NotBlank @Size(max = 500) String notes
) {}
```

---

## 4. OWASP Top 10 Mitigations

| #   | Vulnerability             | Mitigation in S.M.I.L.E                                              |
| --- | ------------------------- | -------------------------------------------------------------------- |
| A01 | Broken Access Control     | RBAC + ownership checks on every endpoint                            |
| A02 | Cryptographic Failures    | RS256 JWT, AES-256 for PII at rest, TLS 1.2+ in transit              |
| A03 | Injection                 | Parameterized queries, Bean Validation, no dynamic SQL               |
| A04 | Insecure Design           | Threat modelling (STRIDE) before new feature design                  |
| A05 | Security Misconfiguration | Hardened Docker images, no default credentials, env-specific configs |
| A06 | Vulnerable Components     | Dependabot + `./mvnw dependency-check`, `pip-audit`                  |
| A07 | Auth Failures             | RS256 JWT, refresh rotation, MFA for admin roles                     |
| A08 | Software Integrity        | Docker image digest pinning, signed commits                          |
| A09 | Logging Failures          | Structured logs, traceId on every request, no PII in logs            |
| A10 | SSRF                      | Allowlist outbound URLs; reject private-range IPs in user input      |

---

## 5. Transport Security

- **HTTPS only** in staging and production (enforce with HSTS header).
- TLS 1.2 minimum; TLS 1.3 preferred.
- HTTP → HTTPS redirect must be permanent (301).
- Gateway must strip/block `X-Forwarded-*` headers from external clients.

---

## 6. HTTP Security Headers

All responses from the Gateway must include:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

Frontend (`next.config.ts`) must configure CSP headers — no `unsafe-inline` scripts in production.

---

## 7. CORS Policy

- Allowed origins must be explicitly listed — never `*` in production.
- Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Credentials (`withCredentials: true`) require exact origin matching.

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("https://smile.example.com"));
    cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    cfg.setAllowCredentials(true);
    ...
}
```

---

## 8. Rate Limiting

| Tier                     | Limit       | Scope    |
| ------------------------ | ----------- | -------- |
| Public (unauthenticated) | 20 req/min  | per IP   |
| Authenticated user       | 100 req/min | per user |
| AI inference endpoints   | 10 req/min  | per user |
| Admin endpoints          | 30 req/min  | per user |

- Implemented at Gateway level (Spring Cloud Gateway `RequestRateLimiter`).
- On limit breach: respond `429 Too Many Requests` with `Retry-After` header.

---

## 9. Audit Logging

Every **state-changing** operation on sensitive resources must write an audit log entry:

```json
{
  "timestamp": "2026-05-04T00:00:00Z",
  "traceId": "...",
  "actorId": "user-uuid",
  "actorRole": "DENTIST",
  "action": "MEDICAL_RECORD_VIEWED",
  "resourceType": "MedicalRecord",
  "resourceId": "record-uuid",
  "ipAddress": "1.2.3.4",
  "outcome": "SUCCESS"
}
```

- Audit logs are **append-only** and must be stored separately from application logs.
- Must include: `timestamp`, `actorId`, `action`, `resourceId`, `outcome`, `ipAddress`, `traceId`.
- Sensitive resources: `MedicalRecord`, `ConsentRecord`, `Payment`, `Prescription`, `PatientData`.

---

## 10. Dependency Vulnerability Management

- **Java**: run `./mvnw org.owasp:dependency-check-maven:check` in CI; block merge if CVSS ≥ 7.
- **Python**: run `pip-audit` in CI; block if any known critical CVE.
- **Node/FE**: run `pnpm audit --audit-level high` in CI; block on high/critical.
- Enable **Dependabot** alerts and auto-PRs for all repos.
- Review and merge security PRs within **3 business days**.

---

## 11. Medical Data (HIPAA / Privacy)

- Patient PII must be **encrypted at rest** (AES-256) in the database.
- Medical record contents must never appear in application logs.
- Data access must require a valid patient consent record (validated by the clinical/EMR service).
- Data deletion requests must propagate to all services and comply with the right-to-erasure.
- Data export for training AI models must be anonymised / de-identified first.
