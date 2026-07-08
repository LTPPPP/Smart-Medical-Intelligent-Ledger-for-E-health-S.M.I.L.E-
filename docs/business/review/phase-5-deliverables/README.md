# Phase 5 — Deliverables: Test Suite + Compliance Report 🟡 (after Phases 1–4)

**Goal:** turn confirmed findings into (a) a regression test suite and (b) a compliance report +
GitHub issue backlog the team can execute.

**Source:** BUSINESS_FLOW_SOURCE.md §12 Final (actor validation matrix), §11.10 (T-DOC tests),
§9 (issue backlog P0/P1/P2), Phase 7 test groups (§8 Plan).

## Planned tasks

| ID | Task | Status |
|----|------|--------|
| T5.1 | Automate the actor validation matrix (Final §12) as e2e/API tests — reuse T1.4 scripts | ⬜ |
| T5.2 | Automate T-DOC-001…012 as backend integration tests | ⬜ |
| T5.3 | Compliance report: requirement ↔ code state ↔ verdict ↔ severity ↔ legal ref (roll up all phase FINDINGS.md) | ⬜ |
| T5.4 | Convert findings to GitHub issues mapped to the doc's P0/P1/P2 backlog (§9); label by role + severity | ⬜ |
| T5.5 | Update BUSINESS_FLOW_SOURCE.md audit sections (or add addendum) marking which doc-era findings are 🟢 fixed, so the doc stays trustworthy | ⬜ |

## Report skeleton

`compliance-report.md`:
1. Executive summary (pass/fail counts per phase, per role)
2. Fixed-since-audit list (🟢)
3. Open findings by severity with evidence
4. Legal exposure notes (Luật KCB Đ7.10/Đ69, TT32 Đ52, TT13/2025, TT26/2025, Luật BVDLCN)
5. Recommended fix order (aligned to doc §11.9 P0 slice)
