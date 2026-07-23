# Test Strategy — 2-Minute Brief (feeds paper §6 `test.tex`)

Goal of the doc: one place that records **every unit and system test** for
S.M.I.L.E — what each level covers, where the files live, how to run them, and
the numbers we report in the paper.

## The 3 test levels we record

| Level | Question it answers | Tool | Scope of one test | Needs a DB? |
|---|---|---|---|---|
| **Unit** | "Does this service/function behave?" | Jest (BE), Vitest (FE) | One class, deps mocked | No |
| **Integration / API** | "Does the HTTP endpoint + DB + guards work together?" | Jest e2e (supertest) | One controller route, real Postgres | Yes (throwaway) |
| **System / E2E** | "Does a whole use case work across services?" | manual now → Playwright later | UC01…UC87 user journey | Yes (full stack) |

## Where things stand today (baseline to grow from)

| Area | Tool | Files now | Gap |
|---|---|---|---|
| iam-service | Jest | 11 unit | no e2e files (scripts exist) |
| clinical-emr-service | Jest | 36 unit | no e2e files (docker harness ready) |
| gateway-service | Jest | 2 unit | thin |
| payment-service | Jest | **0** | none — highest risk |
| frontend/web | Vitest | 18 unit | no component-flow / E2E |
| CI (`ci.yml`) | GH Actions | lint only | **no test job runs on PR** |

## How to prepare to test (setup once)

1. **Node 20 + package manager** per service — iam uses **bun**, emr/web use **npm**
   (matches `ci.yml`). Run `npm ci` / `bun install` in each service dir.
2. **Env files** — copy each service's `env-example*` to `.env`. Watch the known
   gotchas: `KYC_OCR_ENABLED`, `AUTH_OTP_EXPIRES_IN`, DB credentials.
3. **Unit tests need nothing else** — deps are mocked. `npm test` runs now.
4. **Integration/E2E need Postgres** — clinical-emr already ships
   `docker-compose.relational.test.yaml`; use `npm run test:e2e:relational:docker`.
   For other services, spin a throwaway Postgres via compose before `test:e2e`.
5. **System tests** — bring the stack up with root `compose.yaml`, seed with
   `database/` scripts, then walk the UC scripts.

## Commands (per service dir)

```bash
npm test              # unit — run + report pass/fail
npm run test:cov      # unit + coverage % (the number the paper cites)
npm run test:e2e      # integration/API (needs Postgres up)
# frontend:
npm test              # vitest run
```

## What the doc will contain (fill order)

1. **Test matrix** — one row per UC01…UC87 × {unit, API, system}, marked
   ✅ covered / ⚠️ partial / ❌ none. This is the spine.
2. **Per-service coverage table** — `test:cov` output, updated each milestone.
3. **How-to-run appendix** — the setup + commands above, verbatim.
4. **System-test scripts** — steps + expected result per critical UC (auth,
   booking, payment, KYC), traceable back to the sequence diagrams.

## Priorities (write tests in this order)

1. **payment-service unit tests** — 0 today, money path, biggest risk.
2. **Wire a test job into `ci.yml`** — lint-only means nothing is enforced on PR.
3. **First real e2e files** for iam (auth: register / login / forgot+OTP / reset)
   and emr (booking), using the harnesses that already exist.
4. **System-test scripts** for the top ~10 critical UCs, linked to their `.puml`.

> Definition of done for the doc: the UC × level matrix has no blank cells, every
> non-❌ cell links to the test file that backs it, and `test:cov` numbers are
> pasted in with the date they were captured.
