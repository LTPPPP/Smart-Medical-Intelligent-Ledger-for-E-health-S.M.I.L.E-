# testgen — deterministic unit-test-case generator

Reads the NestJS services + their DTOs and writes the full Unit Test workbook
(`docs/testing/SMILE_UnitTest.xlsx`) + the checklist (`docs/testing/UNIT-TEST-TODO.md`).

**Why this exists:** designing UTCID cases for ~372 functions by hand — or by
prompting an LLM per function — is slow and burns tokens. This tool derives the
cases straight from the code, so it costs **zero tokens per function** and
re-runs in seconds whenever the code changes.

## Run

```bash
cd scripts/testgen
npm install          # one-time: pulls xlsx
npm run gen          # regenerates the Excel + TODO
```

## How it derives real cases (no guessing)

For every public service method it reads three things and turns them into a
UTCID grid identical in shape to the FPT template:

| Source in code | Becomes |
|---|---|
| **Method signature** | the parameter/field rows (the `a`, `b`, `c` candidates) |
| **DTO `class-validator` decorators** — `@IsEmail`, `@MinLength(n)`, `@Min/@Max(n)`, `@IsEnum`, `@IsUUID`, `@IsDateString`, `@IsNotEmpty`, `@IsOptional` | the value partitions per field (valid / boundary / invalid) |
| **Method body** — `throw new XException({ errors: { field: 'key' } })` and guard `if`s | the abnormal cases with their **real** expected Exception + Log message |

Each **UTCID column = one combination**: the normal case uses valid values for
every field; each abnormal/boundary case flips exactly one field to a failing
value and records the exception + log that the code actually produces. Result
type is auto-tagged **N / A / B**.

Example — `AccountsService.create()` yields 10 cases: happy path, `email`
invalid-format, `email` empty, `password` len-7 (boundary), `password` empty,
`gender`/`role` bad enum, and the three `*AlreadyExists` conflicts — every one
traceable to a line in `accounts.service.ts` or `CreateAccountDto`.

## Ordering & versions

Functions are sorted **main-flow-first** (auth → accounts → OTP → payments →
appointments → clinical → supporting/CRUD) via the `modRank` / `methRank` tables
in `genrich.js`. Edit those tables to re-prioritise. Versions map to importance
tiers with 3 dates (v1.0 2026-07-17, v1.1 2026-07-21, v1.2 2026-07-23).

## Files

- `analyze2.js` — the parser: DTO index + method/throw extractor (no deps beyond node).
- `genrich.js` — case rules + Excel/TODO writer.
- `allmeta.json` — generated index (function → sheet/code/version/case-count).

## Notes / limits

- **Styling:** the `xlsx` community lib writes plain cells (no colours/merges).
  Structure and formulas are intact; restyle in Excel if the deliverable needs it.
- **Depth:** cases come from *declared* validation + explicit throws. Logic hidden
  behind service calls (e.g. a downstream 404) isn't inferred — add those by hand
  on the relevant sheet, or extend the rule tables in `genrich.js` once so every
  function benefits.
- **Next step (optional):** the same metadata can emit Jest `*.spec.ts`
  skeletons (one `describe` per function, one `it` per UTCID). Ask to enable it.
