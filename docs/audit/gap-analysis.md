# S.M.I.L.E — Gap Analysis & Defense-Risk Assessment

**Audit date:** 2026-07-14 · **Branch:** `dev` · **Mode:** read-only, evidence-cited.
Companion to [`feature-matrix.md`](./feature-matrix.md). Every claim below is backed by a file path in the matrix.

---

## Executive summary

**The product is far more built than the backlog says; the *research paper's model* is far less built than
everything says.** That inversion is the whole story.

- **Real completion (auditor's estimate from code):** Backend **~88%** of the claimed feature surface,
  Frontend **~90%**, Tests **~45–55% effective**. The backlog — which shows 5 modules "Done" and 7 "Todo"
  on the frontend — **undercounts** reality: 6 of 7 "Todo" FE modules are actually built and wired
  (Appointment, Payment, Chatbot, Service Catalog, Examination, Performance).
- **The engineering is genuinely solid where it counts.** Appointment double-booking is prevented by three
  Postgres GIST `EXCLUDE` constraints with idempotency keys, a status FSM, and a real concurrency test;
  the clinical examination flow (sessions → diagnoses → e-prescription with per-item dosing validation and
  pediatric consent snapshots → orders) is fully implemented; KYC is over-delivered with AES-encrypted
  storage and a real OCR integration. These are not stubs.
- **But three things actively threaten the defense**, and all three are *credibility* problems — a reviewer
  who reads the docs and then the code will catch the gap themselves.

### The 3 things that most threaten the capstone defense

1. **The flagship AI diagnostic model does not exist as code.** `README.md` §2.2A describes a PyTorch
   `DentalMultiTaskNet` (CNN+Transformer, tooth segmentation + cephalometric landmark/angle regression,
   `< 300ms`, `< 8M params`) as the "heart of the diagnostic system," and there is a research paper at
   `docs/paper/main.tex`. **Neither is backed by any code, weights, notebook, training script, or inference
   endpoint** — a repo-wide sweep for torch / `nn.Module` / `.pth` / `.ipynb` finds nothing dental. The
   paper's every result is a literal placeholder (`XXXX%`, `XX.X%`). Worse, the README and the paper describe
   **two *different* non-existent models** (radiographic segmentation vs. 6-class intraoral photo
   classification). For a research capstone, an unbuilt-and-unmeasured headline model with an unfinished
   paper is the single biggest examiner target. **This must be reframed honestly before the defense.**

2. **Payment security is claimed but absent (security theater).** `README.md:101-102` states VNPay callbacks
   validate `vnp_SecureHash` and client IP "to prevent replay attacks." The code does **neither**: VNPay runs
   in mock mode by default (`payments.service.ts:42`) and `handleVnpayReturn` trusts `vnp_ResponseCode==='00'`
   with no signature or IP check (`:240`). The payment-service also has **zero tests**. A security-minded
   examiner asking "show me the checksum verification" will find a `// not used while mocking` branch.

3. **`README.md` is systematically false about the architecture.** It claims Spring Boot / Java 17 / Maven,
   a RabbitMQ async layer, and the PyTorch model — the real system is **NestJS + Bun + TypeORM**, RabbitMQ
   isn't even in `docker-compose.yml`, and there's no ML. The honest internal docs (`docs/architecture/*`,
   `docs/ERD`, live Swagger) contradict the top-level README. Whichever document the panel reads first sets
   their trust level; right now the most-prominent one is fiction.

**Net:** the team should **stop building and start reconciling the narrative to the (strong) code** — rewrite
the README, honestly scope the AI model as "designed, not yet trained," and either implement or explicitly
descope the payment-signature/reminder/RBAC gaps. The demo itself will show well; the documents are the liability.

---

## MUST FIX BEFORE DEFENSE (do these first)

| # | Gap | Why it's a defense risk | Risk | Effort | Evidence |
|---|---|---|---|---|---|
| M1 | **AI model doesn't exist — but is presented as finished.** Reframe README §2.2A + the paper as "proposed / not yet trained," remove fabricated metrics, or (if time) train *something* on the Kaggle set to fill `XXXX%`. | Research capstone's headline deliverable is unbuilt and unmeasured; the paper ships placeholders. Highest examiner-bait item. | **High** | **L** (honest reframe = S; actually training a model = L) | `README.md:87-95`; `docs/paper/main.tex` (`XXXX%`); no model code anywhere |
| M2 | **Remove/junk the false README architecture.** Replace Spring Boot/Java/RabbitMQ/VNPay-checksum claims with the real NestJS/Bun/mock-VNPay reality. | A single read of README vs. code destroys credibility for everything else. | **High** | **S** | `README.md:58-107,141-168` vs. real `backend/service/*` (NestJS/Bun) |
| M3 | **Decide the Payment story: implement `vnp_SecureHash`+IP verification, or clearly label VNPay as a sandbox mock.** Don't claim security you don't perform. | Directly contradicts README; a security question exposes it; 0 tests. | **High** | **M** (real verify) / **S** (honest relabel) | `payments.service.ts:42,101-104,240`; `README.md:101-102` |
| M4 | **Fix the dangling "AI analyze" FE stub** — remove the button/route or wire it to a real service. | If a demo clicks "Analyze," it 404s live (no backend route, no component even calls it). Visible failure. | **Med** | **S** | `dental-image.ts:237-240`, `endpoint.ts:431`; no backend `/analyze` route |
| M5 | **Reset/forgot-password: inject `MailService` so the email actually sends** (the template already exists). | "Password reset = Done" but no email leaves the server; a live demo of the flow silently fails. | **Med** | **S** | `auth.service.ts:295` (`console.log` the hash); `mail/mail.service.ts:42` (unused `forgotPassword()`) |
| M6 | **Add a smoke test suite for payment-service (currently 0)** and wire the Python AI suites into CI. | "We have tests" is undercut by the money-handling service having none and CI running only 2 of 7 packages. | **Med** | **M** | `payment-service` (no `*.spec.ts`); `.github/workflows/ci.yml:78` (`--passWithNoTests`, tests only iam+clinical-emr) |

---

## Full prioritized gap list

### AI / ML integration — FIRST-CLASS FINDING

| Gap | Detail | Risk | Effort |
|---|---|---|---|
| **Dental diagnostic model non-existent as code** | No PyTorch/TF, no `nn.Module`, no `.pth/.onnx/.h5/.ipynb`, no training script, no inference endpoint. The only ML in the repo is the **KYC OCR** (YOLO+VietOCR for ID cards) and the **LangGraph booking chatbot** — neither is dental. | **High** | **L** |
| **Paper is placeholder-only** | `docs/paper/main.tex` reports `XXXX%` / `XX.X%` for every metric; no dataset/code/notebook artifact; no "code available" link. | **High** | **L** |
| **README vs. paper describe different models** | README = radiographic segmentation + cephalometric angles; paper = 6-class intraoral-photo classification. Two unbuilt models, one product. | **High** | **S** (pick one, scope honestly) |
| **FE `analyzeImage` is a dead stub** | Calls `/dental-images/:id/analyze` (404, no backend route); no component invokes it; `AIAnalysisResult` is an empty interface. | **Med** | **S** |

**Verdict:** the AI diagnostic capability is **aspirational**. The two *real* AI services are good work but are
supporting features (OCR for KYC, NLP for booking), not the diagnostic centerpiece the capstone advertises.

### Design-doc reality — FIRST-CLASS FINDING

Better than the backlog's blank columns imply, but with real holes.

| Artifact | State | Risk if asked |
|---|---|---|
| OpenAPI/Swagger (live, all 4 services + gateway aggregator) | **Present, real** (`backend/service/*/src/main.ts`) | Low |
| ERD / data model (702 lines, 9 mermaid `erDiagram`, from migrations) | **Present, real** (`docs/architecture/erd.md`) | Low |
| Architecture diagrams (mermaid + 124-line PlantUML) | **Present, real** (`docs/architecture-diagram.md`, `docs/diagrams/architecture.puml`) | Low |
| Sequence diagrams (8 mermaid `sequenceDiagram`) | **Present** (`docs/USER_FLOW.md`, etc.) | Low |
| **Class diagrams** | **Absent** (0 `classDiagram` blocks) | **Med** — commonly required rubric item |
| **Formal SRS / SDS documents** | **Absent as standalone docs** (folded into README §1–2) | **Med** — commonly required rubric item |
| **ADRs / decision records** | **Absent** (decisions live ad-hoc in `docs/superpowers/plans/`, `specs/`) | Low |

**Action:** generate a class diagram from the TypeORM entities and split a real SRS/SDS out of the README before
defense — these are cheap (S–M) and are exactly the artifacts a rubric checks for.

### Backend gaps

| Gap | Risk | Effort | Evidence |
|---|---|---|---|
| **Granular RBAC is decorative** — `permissions`/`role_permissions`/`user_roles` have full guarded CRUD but no guard ever reads them; authz is only the single `account.role` enum. Assigning a permission changes nothing. | **Med** | **M** | `roles.guard.ts:38`; no `PermissionsGuard` anywhere |
| **Appointment "reminder" is manual-only** — no `@nestjs/schedule`/cron; booking itself sends no notification (`// TODO UC-054/055`). "Reminder: Done" misleads anyone expecting auto-fire. | **Med** | **M** | `appointments.controller.ts:447`; `appointments.service.ts:457` |
| **Dental-image byte upload is unwired** — real multer/S3 `FilesModule` exists but is **orphaned** (not imported in `app.module.ts`), so `POST /files/upload` isn't mounted; images persist only a metadata key. | **Med** | **S–M** | orphaned `files/` module; `dental-images.entity.ts:44` (`image_url` string) |
| **PACS is a log table, not a sync engine** — `pacs-sync-logs` records rows a caller supplies; there is no DICOM client. | **Low** | **L** (if real PACS wanted) | `pacs-sync-logs.service.ts:18` |
| **Schedule conflict guard is duplicate-only** — no time-overlap or room check; a null `shift_id` bypasses both the app check and the unique index. | **Med** | **M** | `doctor-schedules.service.ts:73`; `@Unique(doctor_id,work_date,shift_id)` |
| **`/reports/dashboard/patient` has no role/ownership check** (IDOR) — any authenticated user can pass any `patient_id`. | **Med** | **S** | `reports.controller.ts:148` (no `@Roles`) |
| Reschedule-into-occupied-slot returns **500 not 409** (the `23P01`→409 translation exists only in `create()`). | **Low** | **S** | `appointments.service.ts:435` vs `:1047` |
| Weak default internal secret `'smile-internal-dev-key'` if env unset. | **Low** | **S** | `kyc-verifications.service.ts:383` |
| Debug `console.log` in the hot login path. | **Low** | **S** | `auth.service.ts:101,108` |

### Frontend gaps

| Gap | Risk | Effort | Evidence |
|---|---|---|---|
| **Dental-image upload sends no binary** — builds a fake `storageKey`, POSTs `image_url` metadata; the `File` bytes are never transmitted → records point at nonexistent storage. | **Med** | **M** (paired with orphaned BE `FilesModule`) | `dental-image.ts:101-116` |
| **AI-analyze + download buttons unwired** (stubs, no UI references). | **Low** | **S** | `dental-image.ts:240`, `useDentalImage.ts:171` |
| Payment/Chatbot FE complete but depend on a **mock/gated backend** — chatbot needs `AI_ROUTES_ENABLED=true` (gateway strips the route otherwise) and isn't in the default compose; payment hits mock VNPay. | **Med** | **S** (enable/document) | `services.config.ts:130` |
| Consistency smells: pages bypass their own feature hooks (duplicate wiring), a dead "Tải PDF" button, a couple hardcoded base URLs, some un-reskinned (Vietnamese-labeled) payment/refund screens. | **Low** | **S–M** | `patients/[id]/medical-records/[recordId]/page.tsx:370`; `service.api.ts:5` |

### Testing gaps

| Gap | Risk | Effort | Evidence |
|---|---|---|---|
| **payment-service: 0 tests** (money-handling code, refund FSM, untested). | **Med** | **M** | no `*.spec.ts` in `payment-service` |
| **CI runs tests for only iam + clinical-emr**; frontend, payment, gateway, and both Python AI suites never run in CI; `--passWithNoTests`, no coverage gate. The two strongest suites (AI) run only locally. | **Med** | **S** (add CI jobs) | `.github/workflows/ci.yml:78` |
| Whole modules untested: clinics/rooms, work-shifts, service catalog (4), reports, auth, RBAC, mail, OAuth. | **Low–Med** | **L** | (per matrix) |

---

## What's genuinely strong (say this out loud at the defense)

- **Appointment integrity** — 3 Postgres GIST `EXCLUDE` constraints (doctor/room/patient) + idempotency keys +
  status FSM, with a real Postgres concurrency test. Hard to fool.
- **Clinical examination** — full sessions→diagnoses→treatment-plans→e-prescription flow; e-Rx enforces per-item
  dosing completeness and snapshots guardian consent for minors. All 10 sub-modules real and tested.
- **KYC** — AES-encrypted document storage, consent/retention tracking, admin file-access auditing, and a real
  (env-gated) OCR microservice with the repo's strongest iam-side test suite.
- **Booking chatbot** — a real LangGraph agent that calls the real backend and degrades gracefully without an LLM;
  ~25 tests including safety invariants (idempotent commit, token supersession).
- **Documentation infrastructure** — live OpenAPI on every service, a migration-derived ERD, and architecture +
  sequence diagrams. The bones of a good SDS already exist.

---

## Suggested pre-defense sequence (highest leverage first)

1. **Rewrite README.md** to the real architecture; scope the AI model as "proposed, not yet trained"; strip
   fabricated metrics. *(M2, M1 — S)*
2. **Relabel or harden Payment** (mock-sandbox banner, or implement `vnp_SecureHash`+IP). *(M3 — S/M)*
3. **Delete the dead AI-analyze button** and the no-binary upload path, or wire `FilesModule` + real upload. *(M4 — S)*
4. **Wire `MailService` into forgot/reset** so a live demo works. *(M5 — S)*
5. **Generate a class diagram + split an SRS/SDS** from the README/ERD. *(design-doc gap — S/M)*
6. **Add payment smoke tests + broaden CI** to all packages. *(M6 — M)*
7. If time: **enforce the granular RBAC** (a `PermissionsGuard`) and **add a real reminder cron**, or drop both
   claims. *(M — decide honestly)*

*Estimated critical-path effort to close the "must fix" list: ~2–4 focused days (mostly honest re-documentation
and small wiring fixes, not new subsystems). Training an actual dental model is the only Large item and is
optional if the paper/README are reframed as proposed work.*
