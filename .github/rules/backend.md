---
applyTo: "backend/**"
---

# ⚙️ Backend Rules — S.M.I.L.E

> Related: [security.md](./security.md) | [docs-and-build.md](./docs-and-build.md)

## Layer Architecture

Every microservice **must** follow the strict 4-layer architecture.  
No layer may skip or bypass another layer.

```
HTTP Request
    │
    ▼
Controller      — HTTP mapping, request validation, response shaping only
    │
    ▼
Service         — ALL business logic lives here (and only here)
    │
    ▼
Repository      — JPA / persistence queries only
    │
    ▼
Entity/DB
```

---

## Layer Responsibilities

| Layer          | Allowed                                             | Forbidden                                                   |
| -------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| **Controller** | Parse request, call service, return ResponseEntity  | Business logic, DB access, calling other repositories       |
| **Service**    | Business rules, orchestration, calling repositories | Building HTTP responses, direct DB calls without repository |
| **Repository** | JPA queries, custom `@Query`                        | Business logic, HTTP concerns                               |
| **Entity**     | JPA annotations, field definitions                  | Business methods, HTTP/DTO concerns                         |

---

## Service-to-Service Communication

1. **Cross-service calls** must go through the API Gateway or a declared **OpenFeign client**.
2. **Cross-service tasks** (notifications, AI inference) go through the API Gateway or a declared client — never ad-hoc REST calls between services.
3. **Direct DB access across service boundaries is forbidden** — each service owns its own schema/tables.
4. Service contracts are exposed only via a **Java interface**; implementation classes stay package-private.

```java
// ✅ CORRECT — Feign client in clinical-emr-service calling iam-service
@FeignClient(name = "iam-service", url = "${iam.service.url}")
public interface IamServiceClient {
    @GetMapping("/api/v1/users/{id}")
    UserResponse getUserById(@PathVariable String id);
}

// ❌ WRONG — direct RestTemplate call inside a Service class
ResponseEntity<UserResponse> resp = restTemplate.getForEntity(
    "http://iam-service/api/v1/users/" + id, UserResponse.class);
```

---

## DTO & Mapper Rules

- **Request / Response DTOs** must be separate classes — never expose Entity directly via API.
- **DTO ↔ Entity** conversion must use a dedicated `*Mapper` class (MapStruct preferred).
- Mapper classes must **never** contain business logic — transform only.

```java
// ✅ CORRECT
@Mapper(componentModel = "spring")
public interface AppointmentMapper {
    AppointmentResponse toResponse(Appointment entity);
    Appointment toEntity(AppointmentRequest request);
}

// ❌ WRONG — inline mapping inside controller
appointment.setStatus(request.getStatus().toUpperCase()); // business logic in controller
return new AppointmentResponse(appointment.getId(), ...); // manual mapping in controller
```

---

## Dependency Direction

```
controller → service → repository
                ↓
           (shared utils)
           common/module
```

- **Circular dependencies between services are forbidden**.
- Shared utilities, constants, and exceptions go in a `common/` module.
- No service may import from another service's internal package.

---

## Cohesion Rules

Each class must have **one reason to change** (SRP):

| What belongs together      | Class to create             |
| -------------------------- | --------------------------- |
| All appointment CRUD logic | `AppointmentService`        |
| Appointment DB queries     | `AppointmentRepository`     |
| Appointment HTTP endpoints | `AppointmentController`     |
| Appointment field mapping  | `AppointmentMapper`         |
| Appointment domain events  | `AppointmentEventPublisher` |

If a service class exceeds **400 lines**, extract sub-concerns into dedicated service classes or utility classes.

---

## Error Handling

- Every service method that can fail must throw a **typed domain exception** (e.g., `AppointmentNotFoundException`).
- Controller advice (`@RestControllerAdvice`) must map domain exceptions to HTTP status codes centrally — never `try/catch` in controllers.
- Never swallow exceptions silently (`catch (Exception e) {}`).

---

## Testing

1. **Every public service method** must have a unit test covering:
   - Happy path
   - At least one validation / error path
2. **Integration tests** must use `@SpringBootTest` + TestContainers for DB-dependent flows.
3. **Controller tests** use `@WebMvcTest` with mocked service.
4. Run: `./mvnw test` before every push.

---

## Package Structure (per microservice)

```
<service-name>/
  src/main/java/com/smile/<service>/
    controller/      ← @RestController classes
    service/
      impl/          ← @Service implementations
    repository/      ← @Repository interfaces
    entity/          ← @Entity classes
    dto/
      request/       ← *Request classes
      response/      ← *Response classes
    mapper/          ← MapStruct interfaces
    exception/       ← Domain exceptions + @RestControllerAdvice
    config/          ← Spring configs (Security, Feign, Kafka, etc.)
    event/           ← Event payloads
```

---

## REST API Design

### URL Conventions

```
GET    /api/v1/appointments              ← list (paginated)
GET    /api/v1/appointments/{id}         ← single resource
POST   /api/v1/appointments              ← create
PUT    /api/v1/appointments/{id}         ← full update
PATCH  /api/v1/appointments/{id}         ← partial update
DELETE /api/v1/appointments/{id}         ← delete
POST   /api/v1/appointments/{id}/cancel  ← action sub-resource
```

- **Plural nouns** for resource names — never verbs in the path.
- **versioning** via path prefix `/api/v1/` — bump to `v2` only for breaking changes.
- Resource IDs in paths must be **UUID** strings, never auto-increment integers.

### Standard Response Envelope

Every response must wrap payload in a consistent structure:

```json
// Success
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-05-04T00:00:00Z"
}

// Paginated list
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "APPOINTMENT_NOT_FOUND",
    "message": "Appointment 'abc-123' does not exist.",
    "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
```

### Pagination

- Default page size: **20**, max: **100**. Reject requests with `size > 100` (400).
- Always use `Pageable` from Spring Data — never manually slice lists in service layer.
- Return `X-Total-Count` header alongside the pagination body.

### HTTP Status Codes

| Situation                           | Status    |
| ----------------------------------- | --------- |
| Successful GET / POST action        | 200 / 201 |
| Resource not found                  | 404       |
| Validation error (bad input)        | 400       |
| Unauthorized (no/invalid token)     | 401       |
| Forbidden (valid token, wrong role) | 403       |
| Conflict (duplicate resource)       | 409       |
| Internal error                      | 500       |

---

## Database Rules

### Schema Ownership

- Each microservice manages **its own schema** (prefix: `iam_`, `clinical_`, `payment_`, etc.).
- Cross-schema joins are **forbidden** — use API calls or events instead.

### Migrations

- All schema changes via **Flyway** (`V<timestamp>__<description>.sql`).
- Migrations are **append-only** — never modify an existing migration file.
- Destructive DDL (`DROP`, `TRUNCATE`) requires a separate rollback migration.

### N+1 Prevention

- Use `@EntityGraph` or `JOIN FETCH` for any relationship loaded in a list endpoint.
- Never call a repository inside a loop.
- Verify query count with `spring.jpa.show-sql` + Hibernate stats in dev.

```java
// ✅ CORRECT
@EntityGraph(attributePaths = {"patient", "dentist"})
List<Appointment> findByClinicId(String clinicId);

// ❌ WRONG — N+1
List<Appointment> appts = repo.findAll();
appts.forEach(a -> System.out.println(a.getPatient().getName()));
```

### Indexing

- Every foreign key column must have a database index.
- Columns used in `WHERE`, `ORDER BY`, or `JOIN` conditions on large tables must have an index.
- Index names: `idx_<table>_<column(s)>`.

### Transactions

- `@Transactional` on **service** methods only — never on controller or repository.
- Read-only queries: `@Transactional(readOnly = true)` for performance.
- Never use `REQUIRES_NEW` without a documented reason.

---

## Caching

- Use **Redis** (via Spring Cache) for data that is expensive to compute and stale within a TTL.
- Cache keys must include the service prefix and version: `clinical:v1:appointment:<id>`.
- Always set an explicit TTL — never use infinite cache.
- Cache must be **invalidated** on write operations (evict on create/update/delete).

```java
@Cacheable(value = "appointments", key = "'v1:' + #id")
public AppointmentResponse getById(String id) { ... }

@CacheEvict(value = "appointments", key = "'v1:' + #id")
public AppointmentResponse update(String id, AppointmentRequest req) { ... }
```

---

## Observability & Logging

### Logging Rules

- Use **SLF4J + Logback** — never `System.out.println`.
- Log levels:
  - `ERROR`: unrecoverable failures, exceptions that reach the controller advice.
  - `WARN`: recoverable issues, deprecated API usage, retry attempts.
  - `INFO`: significant business events (appointment created, payment processed).
  - `DEBUG`: internal flow details (disabled in production).
- **Never log PII** (patient name, IC number, phone) at any log level.
- Every log line in a request context must carry `traceId` and `userId` via MDC.

```java
// ✅ CORRECT — structured, no PII
log.info("Appointment created. id={} clinicId={} traceId={}",
    appointment.getId(), appointment.getClinicId(), MDC.get("traceId"));

// ❌ WRONG
System.out.println("Appointment created for patient " + patient.getFullName());
```

### Metrics

- Expose Spring Actuator metrics at `/actuator/prometheus`.
- Add business metrics for key flows: booking rate, payment success rate, AI inference latency.
- Every new endpoint must have a `@Timed` annotation or manual `Timer` registration.

### Distributed Tracing

- All services must propagate `traceparent` headers (OpenTelemetry W3C format).
- The `traceId` must appear in every error response under `error.traceId`.

---

## Resilience Patterns

- **Timeout**: every Feign client call must define a `connectTimeout` and `readTimeout`.
- **Retry**: use Spring Retry with exponential backoff for transient failures (max 3 attempts).
- **Circuit Breaker**: wrap Feign clients with Resilience4j `@CircuitBreaker`.
- **Fallback**: every circuit-broken method must have a fallback that returns a safe degraded response.

```java
@CircuitBreaker(name = "iam-service", fallbackMethod = "userFallback")
public UserResponse getUser(String id) { ... }

public UserResponse userFallback(String id, Throwable t) {
    log.warn("IAM service unavailable, using fallback. id={}", id);
    return UserResponse.anonymous();
}
```

---

## API Security (BE-specific)

- JWT validation happens **in Gateway** — individual services trust the forwarded `X-User-Id` and `X-User-Role` headers.
- Services must **not** re-validate JWTs internally (avoid double-validation).
- Rate limiting is enforced at Gateway level (`100 req/min` per user by default).
- All write endpoints must verify CSRF token if session-based auth is used.
- See [security.md](./security.md) for full security policy.
