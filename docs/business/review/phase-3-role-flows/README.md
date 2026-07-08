# Phase 3 — Per-Role Flow Review 🟠 P1 (starts after Phase 2)

**Goal:** verify each role's full business flow against the specs. Priority order: Doctor →
Receptionist → Patient → Admin → Nurse.

**Source:** BUSINESS_FLOW_SOURCE.md — Doctor review (§4, §11.3 use cases, §11.10 tests),
Receptionist (§I1–I9), Nurse (§J1–J9, minus out-of-scope inventory/sterilization),
Admin (§K1–K10), Final §9 per-role gap tables; ROLE_BENCHMARK.md per-role suggestions.

## Planned tasks

| ID | Task | Key checks | Status |
|----|------|-----------|--------|
| T3.1 | **Doctor**: run T-DOC-001 → T-DOC-012 (doc §11.10) | worklist scoping, start-exam guards, dup session, nurse-final 403, signed immutability, image access | ⬜ |
| T3.2 | **Doctor**: use cases D-UC01–D-UC14 vs UI/API | session-centric workspace (queries by session not patient), dental chart in core workspace, ready-to-sign checklist | ⬜ |
| T3.3 | **Doctor**: prescription lifecycle | draft→issue/sign→cancel; TT26/2025 required fields (drug, dose, route, duration, instructions, date, doctor sign); child fields; no DISPENSED in doctor flow | ⬜ |
| T3.4 | **Doctor**: treatment plan lifecycle | quote/estimated cost, risk disclosure, consent ACCEPTED/PARTIAL/DECLINED, no IN_PROGRESS without consent (T-DOC-011), price version lock | ⬜ |
| T3.5 | **Receptionist**: I1–I9 flows | day dashboard, queue (likely missing), walk-in quick-register, counter payment/receipt, shift reconciliation, refund limit, no clinical detail access | ⬜ |
| T3.6 | **Patient**: booking/reschedule/cancel policy, record export request workflow (PL-01 Đ69.4), notification preference, guardian <18 | ⬜ |
| T3.7 | **Admin**: KYC review queue (staff-credential scope only!), refund approval state machine, leave approval, facility/price config, audit log coverage of PHI access | ⬜ |
| T3.8 | **Nurse**: gap documentation | no independent flow expected — document what exists (vitals? room states?) vs J1–J4/J7 scope; inventory (J5) & sterilization (J6) are OUT of scope | ⬜ |

## Findings → `FINDINGS.md` (create when phase starts)
