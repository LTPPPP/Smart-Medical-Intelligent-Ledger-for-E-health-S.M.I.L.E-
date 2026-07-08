# Business Compliance Review — Master Tracker

Review & test the existing code against the business flows defined in:
- [`../BUSINESS_FLOW_SOURCE.md`](../BUSINESS_FLOW_SOURCE.md) — standard flows, legal baseline, per-role specs, P0/P1/P2 gaps
- [`../ROLE_BENCHMARK.md`](../ROLE_BENCHMARK.md) — role benchmark vs other dental PMS/EHR platforms

> ⚠️ **Important context:** the code audit inside BUSINESS_FLOW_SOURCE.md was done ~30/06–01/07/2026.
> The codebase has moved since (e.g. admin-flow merge). A quick scan on 08/07/2026 shows several
> "P0 findings" appear **already fixed** (RolesGuard applied, `appointment_id` on examination session,
> `finalize`/`amendments` routes exist, frontend middleware guard re-enabled). Every task therefore
> records **Doc claim → Current state → Verdict**, not just the doc claim.

## Status legend

| Symbol | Meaning |
|--------|---------|
| ⬜ TODO | Not started |
| 🔄 IN PROGRESS | Being verified |
| ✅ PASS | Code matches business requirement |
| ❌ FAIL | Confirmed gap — needs fix/issue |
| 🟢 FIXED | Doc reported a gap, code has since fixed it (verified) |
| ⏸️ BLOCKED / N/A | Blocked or out of scope |

## Phases

| Phase | Folder | Scope | Priority | Status |
|-------|--------|-------|----------|--------|
| 1 | [`phase-1-rbac-auth/`](phase-1-rbac-auth/README.md) | Auth, RBAC, ownership scoping — the gate for everything else | 🔴 P0 | ✅ static done (T1.4 runtime pending) — **8 findings: 1🔴 3🟠 4🟡** |
| 2 | [`phase-2-main-flow/`](phase-2-main-flow/README.md) | Main flow trace: booking → check-in → exam → sign → payment → follow-up | 🔴 P0 | ⬜ TODO |
| 3 | [`phase-3-role-flows/`](phase-3-role-flows/README.md) | Per-role flow review (Doctor → Receptionist → Patient → Admin → Nurse) | 🟠 P1 | ⬜ TODO |
| 4 | [`phase-4-api-contract/`](phase-4-api-contract/README.md) | FE↔BE endpoint contract, route shadowing hygiene | 🟠 P1 | ⬜ TODO |
| 5 | [`phase-5-deliverables/`](phase-5-deliverables/README.md) | Automated test suite + compliance report + GitHub issues | 🟡 P2 | ⬜ TODO |

## Scope decisions locked by the business doc (enforce during review)

From BUSINESS_FLOW_SOURCE.md § "Final → 1. Quyết định phạm vi hiện tại":

1. **KYC is OUT of core flow** — must not gate booking / check-in / examination. Only for staff credential verification.
2. **AI is OUT of core flow** — no auto diagnosis/prescription; suggestion-only if re-enabled later.
3. **No separate cashier role** — Receptionist handles payment, receipt, refund-within-limit, shift reconciliation.
4. **No inventory/warehouse module** — out of scope, do not review/test.
5. **Patients under 18** — guardian/legal representative required for booking, consent, payment, record export.

## How to work a task

1. Open the task file, set status to 🔄 in its header and in the phase README table.
2. Follow the checklist; record evidence as `file:line` + short quote/output.
3. Set the verdict per checklist item (✅ / ❌ / 🟢).
4. ❌ items get a row in the phase `FINDINGS.md` with severity, so Phase 5 can turn them into issues/tests.
