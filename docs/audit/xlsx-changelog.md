# `Report5_Unit_Test_v2.xlsx` — what was ADDED, and the two things that were corrected

**For: Chinh (owner of `Report5_Unit Test.xlsx`)**

Your original file was **not modified**. Everything below describes a separate copy,
`docs/audit/Report5_Unit_Test_v2.xlsx`, produced by `scripts/qa/writeback-unittest-xlsx.py`.

The point of this file is **addition, not revision**. Your workbook records *manual* test
execution. The `*.uc.spec.ts` suite we generated is *automated regression testing*. They are
two different artifacts measuring the same 87 functions, and neither should overwrite the
other. So the automated results arrive as **new rows**, alongside your existing ones.

Re-running the script at any time is safe: every run starts from your pristine original, so
added rows can never duplicate and corrections can never compound. Verified idempotent — two
consecutive runs produce a **byte-identical file** (and zero cell-level differences).

**Nothing else in your workbook was disturbed.** The script edits the spreadsheet XML
surgically inside the `.xlsx` archive rather than re-saving the workbook through a library, so
your embedded image, drawings, comments, print settings, web-extension parts and shared-string
table are all carried across **byte-for-byte identical**. This is enforced, not just intended:
the script refuses to emit a file if any archive entry is missing, unexpectedly added, or
altered outside the parts it declares it is changing. Current run: 116 archive entries in,
116 out, zero drift.

Your `=SUM()` formulas in `Statistics` row 99 are **kept as formulas** — they were always
arithmetically correct, and the fix is in the per-function rows they add up (see §2). Their
stored values are refreshed to match, and the workbook is flagged to recalculate on open, so
Excel and non-Excel readers agree.

---

## 1. What was ADDED (the substance of this file)

Two new rows on each of the 87 function sheets, directly below `Defect ID`:

| row label | contents |
|---|---|
| **Automated test** | the name of the generated test covering that UTCID, e.g. `UTCID01 — valid credentials on an active account return a LoginResponseDto [MATCHES]` |
| **Spec alignment** | `MATCHES` (code behaves as the sheet says) or `DIVERGES` (it does not) |

They are rows rather than columns because UTCIDs run horizontally in these decision tables —
one new field per UTCID is structurally a new row.

**A UTCID with no automated test yet is left BLANK.** It is never marked `Failed` and never
marked `Untested`. Blank means "automation has not reached this case", nothing more.

At the time of writing, **42 of 398 UTCIDs** carry an automated result (see
`scripts/qa/coverage.py` for the live figure — no coverage number in this project is typed by
hand). The remaining 356 are blank and will fill in as generation proceeds.

---

## 2. What was CORRECTED — only two things, both arithmetic

### 2.1 The Statistics sheet counted 431 test cases; there are 398

This is the one number worth walking through, because the conclusion is **your function
sheets were right all along** — only the summary tally was off.

**Evidence, and it is not arguable:**

- Every one of the 87 function sheets was checked three ways: the number of `UTCID` column
  headers on row 9, the number of manual `Passed/Failed` marks, and the number of cases parsed
  out of the sheet by `scripts/qa/parse-uc-matrix.py`.
- **All three agree, on all 87 sheets, without exception.** Total: **398**.
- Bucket `N` (87) and bucket `B` (12) match the Statistics sheet exactly. The entire
  discrepancy sits in bucket `A`: Statistics said 332, the sheets contain 299.
- `Statistics!C99`, `G99`, `I99` are `=SUM(...)` formulas, so the sub-total was never the
  problem — it faithfully added up per-function rows that were themselves too high.
- Exactly **33 of the 87 per-function rows over-count bucket A by exactly +1**. 33 × 1 = 33,
  and 431 − 398 = 33. The arithmetic closes with nothing left over.

So the correction sets those 33 rows' `A` and `Total` to what the corresponding sheet actually
contains, and re-derives `Passed`/`Failed`/`Untested` from that sheet's own manual marks. The
`=SUM()` formulas were left untouched and now total **398**.

**No manual result was overwritten.** The per-UTCID `Passed/Failed` and `Executed Date` rows
inside every function sheet are exactly as you left them — the script only ever reads them.
What changed is a summary tally that disagreed with them; it now agrees.

Full cell-by-cell list: `docs/audit/xlsx-changelog-raw.txt` (117 cell changes: 33 rows ×
`A`, `Total`, `Passed`, plus the symbol corrections below).

### 2.2 Eleven rows on the Functions sheet named the wrong class

These 11 rows pointed at a class that has nothing to do with the feature the sheet describes —
`PermissionsService.findAll()` and `KycVerificationsService.findOne()` appear repeatedly as
placeholders. Corrected to the real implementation, verified by reading the code at the cited
file and line (source: `docs/audit/qa-recon-symbols.json`):

| sheet | was | now |
|---|---|---|
| View Profile | `KycVerificationsService.findOne()` | `AuthService.me()` |
| Access Audit Log | `PermissionsService.findAll()` | `AuditLogsService.findAll()` |
| View User List | `PermissionsService.findAll()` | `UserProfilesService.findAll()` |
| View Clinic Information | `PermissionsService.findAll()` | `ClinicsService.findAll()` |
| View Treatment Room | `PermissionsService.findAll()` | `TreatmentRoomsService.findAllByClinic()` |
| Notify Shift Transfer | `KycVerificationsService.findOne()` | `DoctorSchedulesService.transferShift()` |
| View Appointment | `PermissionsService.findAll()` | `AppointmentsService.findAll()` |
| Confirm Appointment | `PermissionsService.findAll()` | `AppointmentsService.confirm()` |
| Initiate Payment | `KycVerificationsService.findOne()` | `PaymentsService.initiate()` |
| Confirm Payment - View Payment | `PermissionsService.findAll()` | `PaymentsService.handleVnpayReturn()` |
| Refund - Cancel Payment | `KycVerificationsService.findOne()` | `PaymentsService.requestRefund()` |

Note this affects more than a label: the *test cases* on those 11 sheets were authored against
the wrong function, so their inputs and expected results do not describe the real one. That is
tracked in `docs/audit/uc-divergences.md`, not fixed here.

---

## 3. What was deliberately NOT changed

- **Every manual result cell.** `Passed/Failed`, `Executed Date`, and `Defect ID` rows on all
  87 sheets are untouched.
- **Every condition and expected-result cell.** Where the sheet's expected exception disagrees
  with what the code does — and it does for a large share of cases, mostly
  `BadRequestException` where `clinical-emr` and `payment` actually answer `422
  UnprocessableEntityException` — that disagreement is reported in the new **Spec alignment**
  row as `DIVERGES` and detailed in `docs/audit/uc-divergences.md`. **The expected values
  themselves were left exactly as you wrote them.** Deciding which side should change is your
  call, not the script's.
- **The `Cover` sheet, all formatting, and all formulas.**

---

## 4. Reproducing this

```bash
python3 scripts/qa/parse-uc-matrix.py        # workbook  -> docs/audit/uc-matrix.json (398 UTCIDs)
python3 scripts/qa/coverage.py               # the single source of truth for coverage numbers
python3 scripts/qa/collect-uc-results.py     # jest --json -> docs/audit/uc-results.json
python3 scripts/qa/writeback-unittest-xlsx.py # -> docs/audit/Report5_Unit_Test_v2.xlsx
```
