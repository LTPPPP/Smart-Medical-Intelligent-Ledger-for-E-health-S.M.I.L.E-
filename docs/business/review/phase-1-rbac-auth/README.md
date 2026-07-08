# Phase 1 — RBAC & Auth Verification 🔴 P0

**Goal:** confirm that every medical/clinical route requires a trusted identity, that roles are
enforced at the backend (not UI-only), and that data is scoped by ownership (doctor sees own
patients, patient sees own data). This phase gates Phases 2–5: there is no point tracing business
flows if any role can call any endpoint.

**Source:** BUSINESS_FLOW_SOURCE.md §6.1 (auth/role/navigation audit), §11.7 (line-level evidence),
§10 Final (P0 gaps), K2 RBAC matrix (§K2); ROLE_BENCHMARK.md §0 note (NURSE RBAC, DOCTOR/DENTIST mismatch).

## Task index

| ID | Task | Size | Status | Verdict |
|----|------|------|--------|---------|
| [T1.1](T1.1-frontend-auth-guard.md) | Frontend middleware & route guards | M | ✅ static done | 🟢 bypass fixed; ❌ F1-004, F1-006 |
| [T1.2](T1.2-gateway-trusted-identity.md) | Gateway trusted-identity coverage for medical routes | M | ✅ static done | 🟢 mitigated; ❌ F1-001 |
| [T1.3](T1.3-clinical-service-guards.md) | Clinical-emr / payment / iam guard & `@Roles` coverage | L | ✅ static done | 🟢 guards enforced; ❌ F1-001, F1-008 |
| [T1.4](T1.4-unauthenticated-route-tests.md) | Behavioral tests: unauthenticated + wrong-role calls | L | ⬜ BLOCKED (needs stack) | predicted, see file |
| [T1.5](T1.5-role-permission-matrix.md) | Actual-vs-expected role permission matrix (K2) | L | ✅ static done | ❌ F1-003 + intent rows |
| [T1.6](T1.6-ownership-scoping.md) | Ownership/data scoping (doctor-own-data, patient-own-data) | L | 🔄 code done, runtime pending | ✅ appointments; ❌ F1-002 |
| [T1.7](T1.7-nurse-role-and-naming.md) | NURSE role reality check + DOCTOR/DENTIST naming mismatch | S | ✅ static done | ❌ F1-004, F1-007 |

## Result summary (static pass, 08/07/2026)

**8 findings** (see [FINDINGS.md](FINDINGS.md)): 1 critical, 3 high, 4 medium.
- 🔴 **F1-001** notifications endpoints fully unauthenticated (only place both gateway + service guards are absent).
- 🟠 **F1-002** clinical read-by-id routes not ownership-scoped (Doctor A ↔ Doctor B data leak).
- 🟠 **F1-003** role→permission grant table exists but is dead at runtime; guards are role-only (answers the "grant permission tag to role" question — the model isn't wired in).
- 🟠 **F1-004** DOCTOR (backend) vs DENTIST (frontend) is a functional break, not cosmetic.
- 🟡 F1-005 check-in open to Doctor/Nurse; F1-006 FE guard presence-only + dead allowlists; F1-007 NURSE has no clinical grants; F1-008 files/patient-reps no @Roles.

**Good news (🟢):** the three scariest doc-era claims are already fixed — frontend auth re-enabled,
RolesGuard actually enforced on ~29 controllers, and the gateway gap is neutralized by per-service
JWT re-verification + inbound header stripping. Appointments service is a clean ownership-scoping
reference for fixing F1-002.

**Go/no-go for Phase 2:** GO, with caveats — appointment + examination flows are trustworthy to
trace; treat notifications (F1-001) and cross-doctor reads (F1-002) as known-broken while tracing.

Size: S = < 1h, M = half day, L = 1 day+

## Suggested order

T1.1 → T1.2 → T1.3 (static code review, fast) → T1.7 (small) → T1.5 (matrix, needs T1.3 output)
→ T1.6 → T1.4 (behavioral tests last — they confirm the static findings at runtime).

## Findings log

All ❌ items go to [FINDINGS.md](FINDINGS.md).

## Fix plan

➡️ [**FIX_PLAN.md**](FIX_PLAN.md) — how to remediate all 8 findings + align every role to the
business K2 matrix. Two-stage: Stage 1 hardens the live role-based guards (closes 7/8 findings fast),
Stage 2 wires the dead permission-grant tables into auth (closes F1-003 + enables custom roles).
Needs 6 decisions confirmed before coding (see §7).

## Exit criteria

- [x] Every task file has a verdict on every checklist item. _(T1.4 runtime-only items remain open by design — needs stack.)_
- [x] FINDINGS.md lists each confirmed gap with severity + evidence. _(8 findings.)_
- [x] The K2 actual-vs-expected matrix (T1.5) is complete for all 5 roles.
- [x] A go/no-go note for Phase 2: **GO with caveats** (notifications F1-001 + cross-doctor reads F1-002 known-broken while tracing).

> **Phase 1 static verification: COMPLETE.** Only remaining item is T1.4 runtime confirmation,
> which is blocked on a running stack (predictions recorded). Ready to proceed to Phase 2, or run
> T1.4 first to harden F1-001/F1-002 into proven bugs.
