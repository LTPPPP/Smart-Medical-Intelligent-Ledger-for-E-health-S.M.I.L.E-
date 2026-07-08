# Phase 4 — API Contract & Route Hygiene 🟠 P1 (can run in parallel with Phase 3)

**Goal:** eliminate FE↔BE endpoint drift and NestJS route-ordering bugs that silently break flows.

**Source:** BUSINESS_FLOW_SOURCE.md §6.7 (dental image mismatch), §11.7 rows 4/9 (shadow routes,
stale endpoints), §8 Plan Phase 1 item 5.

## Planned tasks

| ID | Task | Key checks | Status |
|----|------|-----------|--------|
| T4.1 | FE endpoint map vs BE controllers | diff `frontend/web/src/shared/api/endpoint.ts` against actual controller paths; doc-era mismatches: `/images/*` vs `/dental-images`, `/categories` vs `/image-categories`, `EXAMINATION.BY_APPOINTMENT` (BE route now exists — confirm FE uses it), stale `completeSession`/`cancelSession` | ⬜ |
| T4.2 | Route-order shadowing sweep | in every clinical controller: dynamic `:id` routes declared before static (`patient/:id`, `session/:id`, `doctor/:id`) shadow them. Pre-scan note: examination-sessions is now correctly ordered (static at :42–:52 before `:session_id` at :59) — sweep the rest: diagnoses, prescriptions, treatment-plans, dental-images, dental-charts, diagnostic-orders, lab-test-results, doctor-schedules, doctor-leaves | ⬜ |
| T4.3 | Gateway route table vs services | every FE-used prefix routed? dead routes? | ⬜ |
| T4.4 | DTO/type drift | FE types expecting fields BE doesn't return (doc example: FE typed `appointment_id?` before BE had it — find remaining cases) | ⬜ |

## Helper

```bash
# candidate shadowing: first dynamic route line vs first static-multi-segment route line per controller
for f in $(find backend/service/clinical-emr-service/src -name "*.controller.ts"); do
  awk '/@(Get|Patch|Put|Delete|Post)\(/{print FILENAME": "$0}' "$f"
done | grep -E "@Get\('(:|[a-z-]+/:)" | less
```

## Findings → `FINDINGS.md` (create when phase starts)
