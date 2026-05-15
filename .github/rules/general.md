---
applyTo: "**"
---

# 📋 General Rules — S.M.I.L.E

> See also: [frontend.md](./frontend.md) | [backend.md](./backend.md) | [blockchain.md](./blockchain.md) | [ai-service.md](./ai-service.md) | [security.md](./security.md) | [docs-and-build.md](./docs-and-build.md)

## Commit Convention

Follow **Conventional Commits**:

```
<type>(<scope>): <short description>

Types: feat | fix | refactor | test | docs | chore | ci | perf
Scope: iam | gateway | clinical-emr | payment | notification | blockchain | ai | fe

Examples:
  feat(clinical-emr): add appointment rescheduling endpoint
  fix(iam): resolve JWT refresh token race condition
  refactor(fe): split PatientDashboard into sub-components
  test(payment): add integration test for VNPay callback
```

## Branching

```
main          ← production-ready only
develop       ← integration branch
feature/*     ← new features (branch off develop)
fix/*         ← bug fixes (branch off develop)
hotfix/*      ← critical fixes (branch off main)
```

- PRs must target `develop`; never push directly to `main`.
- Branch name mirrors scope: `feature/iam-mfa-support`, `fix/gateway-cors`.

---

## File & Folder Naming

| Context           | Convention                                           |
| ----------------- | ---------------------------------------------------- |
| Java classes      | PascalCase                                           |
| Java packages     | lowercase.dot.separated                              |
| TypeScript/React  | PascalCase for components, camelCase for utils/hooks |
| SQL migrations    | `V<timestamp>__<description>.sql` (Flyway)           |
| Docker files      | `Dockerfile`, `docker-compose.<env>.yml`             |
| Environment files | `.env.example` committed; `.env` never committed     |

---

## Security Baseline

- **No secrets in source code** — use environment variables or a secrets manager.
- **No `.env` files committed** — only `.env.example` with placeholder values.
- **All external inputs validated** — request body, path params, query params.
- **Authentication** required on every endpoint except `/health`, `/actuator/health`, `/api/v1/auth/login`, `/api/v1/auth/register`.
- **HTTPS only** in staging and production.

---

## Environment Variables

- Document every new env var in the corresponding `env.example` file.
- Prefix service-specific vars: `IAM_`, `PAYMENT_`, `BLOCKCHAIN_`, etc.
- Never use default passwords/keys in `env.example`; use descriptive placeholders: `your-secret-here`.

---

## Docker & Infrastructure

- Every service must have a `Dockerfile` with a multi-stage build (builder + runtime image).
- Base images must be pinned to a specific version tag — never use `latest`.
- Services without a health check endpoint (`/health` or `/actuator/health`) will not be merged.

---

## Code Review Checklist

Before approving any PR, verify:

**Size & Structure**

- [ ] No FE component file exceeds 1000 lines (target ~500).
- [ ] No BE service class exceeds 400 lines.
- [ ] No AI/Python file exceeds 500 lines.
- [ ] New components follow the single-responsibility principle.

**Security**

- [ ] No secret / credential / PII in the diff.
- [ ] No `.env` file committed (only `.env.example` allowed).
- [ ] `env.example` updated for every new env var.
- [ ] All new API endpoints have authentication & authorisation checks.
- [ ] External inputs are validated (request body, path params, query params).
- [ ] See [security.md](./security.md) for the full security checklist.

**Quality**

- [ ] All new public methods/functions have unit tests (happy path + error path).
- [ ] No new circular dependencies introduced.
- [ ] No `TODO` / `FIXME` left without a linked issue.
- [ ] No dead / commented-out code committed.

**API & Data**

- [ ] New REST endpoints follow URL conventions (`/api/v1/`, plural nouns, UUID ids).
- [ ] Response uses standard envelope format (`{ success, data, timestamp }`).
- [ ] New DB columns / tables have Flyway migration.
- [ ] New DB columns used in queries have a corresponding index.

**Docs & Build**

- [ ] Public API endpoints documented in Swagger / OpenAPI (`@Operation`, `@ApiResponse`).
- [ ] Public methods have Javadoc / TSDoc.
- [ ] `README.md` or `env.example` updated if setup steps changed.
- [ ] CI pipeline passes (build + lint + test).
- [ ] See [docs-and-build.md](./docs-and-build.md) for documentation standards.

**Conventional Commit**

- [ ] Commit message follows `<type>(<scope>): <description>` format.
- [ ] PR title is descriptive (not "fix" or "update").
