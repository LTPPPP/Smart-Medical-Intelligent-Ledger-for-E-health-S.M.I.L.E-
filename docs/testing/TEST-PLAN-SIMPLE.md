# Testing Plan — Simple Version

For the team. What we test, how many, and the steps. 2-minute read.

---

## What are the 2 kinds of tests?

| Kind | Plain meaning | Who writes it | Needs the app running? |
|---|---|---|---|
| **Unit test** | Check one small piece of code alone (one function/class) | Developers, in code | No |
| **System test** | Use the app like a real user and check the whole flow works | Anyone (click through the app) | Yes, full app up |

Unit = "is each brick solid?"  System = "does the finished house work?"

---

## How many things do we test?

**5 services** (each tested on its own):

| # | Service | What it does | Unit tests today |
|---|---|---|---|
| 1 | iam-service | Login, register, password, roles | 11 |
| 2 | clinical-emr-service | Patients, appointments, records | 36 |
| 3 | gateway-service | Routes requests to services | 2 |
| 4 | payment-service | Payments, refunds | **0 (need to add)** |
| 5 | frontend/web | The website the user sees | 18 |

**System tests:** we walk through the **87 use cases** (UC01–UC87). Start with the
~10 most important: Register, Login, Forgot/Reset password, Book appointment,
Pay, KYC verify.

---

## Step by step — what to do

### Part A: Unit tests (do this first, easiest)

1. Open a terminal in the project folder.
2. For each service, go into its folder and run one command:
   ```bash
   cd backend/service/iam-service && npm test
   ```
   Repeat for `clinical-emr-service`, `gateway-service`, `payment-service`,
   and `frontend/web`.
3. Look for **green PASS**. Write down "X passed / Y total" for each service.
4. Red FAIL = copy the test name → that's a bug to report. Keep going with the rest.

> Full copy-paste commands are in [RUN-ALL-TESTS-TODAY.md](./RUN-ALL-TESTS-TODAY.md).

### Part B: Coverage (the % number for the report)

For services that support it, run `npm run test:cov` instead of `npm test`.
Copy the `All files ... %` line. That's the coverage number.

### Part C: System tests (do the app as a user)

1. Start the whole app: `docker compose up` (from repo root).
2. Open the website.
3. Pick a use case (e.g. **UC02 Login**). Follow its sequence diagram in
   `docs/sequence-diagram/`.
4. Do each step as a user. Does the result match the diagram? ✅ or ❌.
5. Record: use case name, pass/fail, and any screenshot of a problem.

---

## Who does what (split the work)

| Person | Takes |
|---|---|
| Person 1 | iam-service + gateway unit tests |
| Person 2 | clinical-emr-service unit tests (biggest) |
| Person 3 | frontend/web unit tests + **write payment-service tests** |
| Person 4 | System tests: the top 10 use cases |

---

## Done when

- Every service has a "passed/total" number written down.
- Coverage % captured for each service.
- Top 10 use cases each marked ✅ or ❌ with notes.
- Failures listed as bugs to fix.
