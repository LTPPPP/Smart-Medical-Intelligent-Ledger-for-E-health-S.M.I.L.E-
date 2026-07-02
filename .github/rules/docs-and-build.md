---
applyTo: "**"
---

# 📚 Documentation & Build Rules — S.M.I.L.E

---

## 1. Code Documentation

### Java (Javadoc)

Every **public** class, method, and field in the service layer and above must have a Javadoc comment.

```java
/**
 * Schedules a new dental appointment for a patient.
 *
 * @param request  appointment creation payload (must be validated before calling)
 * @param clinicId the clinic where the appointment is booked
 * @return created appointment response with generated ID and status
 * @throws PatientNotFoundException if {@code request.patientId} does not exist
 * @throws SlotUnavailableException if the requested time slot is already taken
 */
AppointmentResponse create(AppointmentRequest request, String clinicId);
```

Required tags:

- `@param` — for every parameter
- `@return` — if non-void
- `@throws` — for every checked or domain exception

### TypeScript / React (TSDoc)

Every exported function, component, hook, and type must have a TSDoc comment.

```ts
/**
 * Fetches and caches the appointment list for the current clinic.
 *
 * @param filters - optional filter criteria (status, date range)
 * @returns TanStack Query result containing paginated appointment list
 *
 * @example
 * const { data, isLoading } = useAppointments({ status: 'PENDING' });
 */
export function useAppointments(filters?: AppointmentFilters) { ... }
```

### Python (Docstring)

Every public function, class, and module must use Google-style docstrings.

```python
def run_inference(image: np.ndarray, threshold: float = 0.5) -> DetectionResult:
    """Run dental condition detection on an image.

    Args:
        image: Pre-processed image array (H x W x 3, uint8, RGB).
        threshold: Confidence threshold for accepting detections (0–1).

    Returns:
        DetectionResult with bounding boxes, labels, and confidence scores.

    Raises:
        ValueError: If image dimensions are not supported.
        ModelNotLoadedError: If the model was not initialised at startup.
    """
```

---

## 2. OpenAPI / Swagger Documentation

- Every REST endpoint **must** be annotated with `@Operation`, `@ApiResponse`, and `@Parameter`.
- Swagger UI is available at `/swagger-ui.html` in `dev` and `staging` profiles only (disabled in production).
- Response schemas must reference DTOs — never use `Object` or `Map` as response type.

```java
@Operation(
    summary = "Create appointment",
    description = "Books a new appointment for the specified patient at the clinic."
)
@ApiResponses({
    @ApiResponse(responseCode = "201", description = "Appointment created",
        content = @Content(schema = @Schema(implementation = AppointmentResponse.class))),
    @ApiResponse(responseCode = "400", description = "Invalid request payload"),
    @ApiResponse(responseCode = "409", description = "Time slot already taken")
})
@PostMapping
public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody AppointmentRequest req) { ... }
```

---

## 3. README Standards

Every service / module directory that contains deployable code **must** have a `README.md` with:

```markdown
# <Service Name>

## Overview

One paragraph describing what this service does and its role in S.M.I.L.E.

## Prerequisites

- Java 21 / Node 20 / Python 3.11
- Docker & Docker Compose

## Environment Variables

| Variable    | Description          | Required | Default |
| ----------- | -------------------- | -------- | ------- |
| `DB_HOST`   | PostgreSQL hostname  | ✅       | —       |
| `REDIS_URL` | Redis connection URL | ✅       | —       |

## Running Locally

\`\`\`bash
cp env.example .env
docker-compose up -d db redis
./mvnw spring-boot:run
\`\`\`

## Running Tests

\`\`\`bash
./mvnw test # unit tests
./mvnw verify -P integration # integration tests
\`\`\`

## API Reference

Swagger UI: http://localhost:<port>/swagger-ui.html

## Architecture Decisions

See `docs/adr/` for Architecture Decision Records.
```

---

## 4. Architecture Decision Records (ADR)

- Significant technical decisions must be recorded as an **ADR** in `docs/adr/`.
- Use the MADR format:

```
docs/adr/
  0001-use-rabbitmq-for-async.md
  0002-jwt-rs256-strategy.md
```

ADR template:

```markdown
# ADR-XXXX: <Title>

**Date**: YYYY-MM-DD  
**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXXX

## Context

Why is this decision needed?

## Decision

What was decided?

## Consequences

What are the trade-offs and impact?
```

Decisions that require an ADR:

- New microservice added
- New persistence store or messaging tech introduced
- Auth mechanism changed
- Breaking API change
- Major library/framework upgrade

---

## 5. Build Standards

### Java (Maven)

```bash
./mvnw clean verify          # full build + unit tests
./mvnw clean verify -P it    # with integration tests
./mvnw checkstyle:check      # lint (Checkstyle)
./mvnw org.owasp:dependency-check-maven:check  # CVE scan
```

- Build **must** pass before any PR merge.
- Test coverage threshold: **≥ 70%** line coverage (enforced by JaCoCo).
- Checkstyle config: `checkstyle.xml` at project root — Google Java Style.
- Fail build if `WARN` or higher Checkstyle violations exist.

### Frontend (Next.js)

```bash
pnpm lint          # ESLint (zero warnings allowed in CI)
pnpm type-check    # tsc --noEmit
pnpm test          # Vitest / Jest
pnpm build         # production build (must succeed)
ANALYZE=true pnpm build  # bundle analysis (run before release PRs)
```

- `pnpm lint` must produce **zero errors and zero warnings** in CI.
- `pnpm type-check` (`tsc --noEmit`) must pass with zero errors — `any` usage must be explicitly justified with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` and a comment.
- Bundle size regression: if total JS bundle increases by > 10 kB (gzip), PR must include justification.

### Python (AI Services)

```bash
ruff check .            # linting (zero errors)
mypy src/               # type checking
pytest tests/ -v        # unit tests
pytest tests/ --cov=src --cov-report=term-missing  # with coverage
pip-audit               # CVE scan
```

- Coverage threshold: **≥ 70%**.
- `mypy` must pass with zero errors in CI.

---

## 6. CI/CD Pipeline Requirements

Every service must have a GitHub Actions workflow that runs on every PR:

```yaml
# Minimum required jobs:
jobs:
  lint: # ESLint / Checkstyle / ruff
  type-check: # tsc / mypy
  test: # unit tests with coverage report
  build: # production build / mvn package
  security: # dependency CVE scan
```

- **All jobs must pass** before merge is allowed.
- Test results must be published as GitHub Checks (use `actions/test-reporter`).
- Docker images must be built and scanned with `docker scout` or `trivy` in CI.

---

## 7. Changelog

- Maintain a `CHANGELOG.md` at the root following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.
- On every release, add entries under `## [version] - YYYY-MM-DD`:
  - `### Added` — new features
  - `### Changed` — non-breaking changes
  - `### Fixed` — bug fixes
  - `### Security` — vulnerability patches
  - `### Deprecated` / `### Removed` — as needed

---

## 8. Environment & Config Documentation

- Every service must have an `env.example` file that documents **all** environment variables.
- Format:

```bash
# Database
DB_HOST=your-postgres-host        # PostgreSQL hostname
DB_PORT=5432                       # PostgreSQL port
DB_NAME=clinical_db                # Database name

# Auth
JWT_PUBLIC_KEY=your-public-key     # RS256 public key (PEM format)
```

- New env vars added without updating `env.example` will cause CI to fail (validated by a lint step).
