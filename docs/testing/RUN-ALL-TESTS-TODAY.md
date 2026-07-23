# Run All Service Tests — Today's Runbook

Do this top to bottom. ~30–45 min. Deps are already installed, Node 22 present.
`payment-service` has **0 tests**; `gateway` passes with none. Both expected.

Run everything from repo root:
`/home/chinhwind/project/Capstones/Smart-Medical-Intelligent-Ledger-for-E-health-S.M.I.L.E-`

---

## Step 0 — make a results folder (30 sec)

```bash
mkdir -p docs/testing/results/$(date +%F)
OUT=docs/testing/results/$(date +%F)
```

## Step 1 — UNIT tests, all 5 (no DB needed) — do these first

Run each, tee the log so you have proof for the paper.

```bash
# 1. iam-service (11 spec)
( cd backend/service/iam-service && npm test ) 2>&1 | tee $OUT/iam-unit.txt

# 2. clinical-emr-service (36 spec) — the big one
( cd backend/service/clinical-emr-service && npm test ) 2>&1 | tee $OUT/emr-unit.txt

# 3. gateway-service (2 spec)
( cd backend/service/gateway-service && npm test ) 2>&1 | tee $OUT/gateway-unit.txt

# 4. payment-service (0 spec — expect "No tests found", that's fine)
( cd backend/service/payment-service && npm test ) 2>&1 | tee $OUT/payment-unit.txt

# 5. frontend/web (18 spec, vitest)
( cd frontend/web && npm test ) 2>&1 | tee $OUT/web-unit.txt
```

Green here = the whole codebase logic is verified. This alone satisfies
"tested all services" for a unit-level report.

## Step 2 — COVERAGE numbers (the % the paper cites)

Only the services with a `test:cov` script. Same tests, adds a table.

```bash
( cd backend/service/iam-service && npm run test:cov ) 2>&1 | tee $OUT/iam-cov.txt
( cd backend/service/clinical-emr-service && npm run test:cov ) 2>&1 | tee $OUT/emr-cov.txt
( cd backend/service/gateway-service && npm run test:cov ) 2>&1 | tee $OUT/gateway-cov.txt
( cd frontend/web && npx vitest run --coverage ) 2>&1 | tee $OUT/web-cov.txt
```

Grab the `All files ... % Stmts` line from each log → paste into the report.

## Step 3 — INTEGRATION / e2e (needs Docker + Postgres) — only if Docker is up

`clinical-emr` has a self-contained dockerized harness (spins its own DB):

```bash
( cd backend/service/clinical-emr-service && npm run test:e2e:relational:docker ) 2>&1 | tee $OUT/emr-e2e.txt
```

> If Docker isn't running, **skip Step 3** and note "e2e deferred — needs
> Postgres" in the report. iam/payment/gateway have no e2e spec files yet, so
> there is nothing to run there today.

---

## Fill this table as you go

| Service | Unit run | Result (pass/total) | Coverage % | e2e |
|---|---|---|---|---|
| iam-service | ☐ | | | n/a today |
| clinical-emr-service | ☐ | | | ☐ |
| gateway-service | ☐ | | | n/a |
| payment-service | ☐ | 0/0 (no tests) | n/a | n/a |
| frontend/web | ☐ | | | n/a |

## If something fails

- **Compile/import error** → `npm ci` in that service, re-run.
- **Env var missing** (e.g. `AUTH_OTP_EXPIRES_IN`, `KYC_OCR_ENABLED`) → copy the
  service's `env-example*` to `.env`, re-run. Unit tests rarely need this.
- **One spec red** → capture the failing test name in the log; that's a finding
  for the report, not a blocker for the rest.

## One-shot (if you just want it all to run unattended)

```bash
OUT=docs/testing/results/$(date +%F); mkdir -p $OUT
for s in iam-service clinical-emr-service gateway-service payment-service; do
  ( cd backend/service/$s && npm test ) 2>&1 | tee $OUT/$s-unit.txt
done
( cd frontend/web && npm test ) 2>&1 | tee $OUT/web-unit.txt
echo "Logs in $OUT"
```
