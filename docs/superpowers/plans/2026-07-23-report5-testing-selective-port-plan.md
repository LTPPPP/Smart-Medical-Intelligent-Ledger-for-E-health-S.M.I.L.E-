# Report 5 Testing And Selective Port Plan

1. Establish a fresh baseline for all five JavaScript services using the
   service-local Node/Jest/Vitest runners. Record suite, test, failure, and
   coverage totals without changing production code.
2. Add focused `payment-service` tests for callback success/idempotency,
   appointment synchronization, refund request validation, and refund review
   notifications. Run the focused suite RED, change production behavior only
   if a real gap is proven, then run the service suite and build GREEN.
3. Verify whether the preserved patient self-access, leave, and appointment
   availability tests describe gaps that still exist on `origin/dev`. Port
   only compatible tests and the minimum required fix.
4. Run coverage for IAM, Clinical EMR, Gateway, Payment, and Frontend. Classify
   failures as source regression, stale test, runner/environment issue, or
   invalid data.
5. Validate Docker Compose, rebuild only the source-under-test services after
   static checks pass, and run health/API checks.
6. Execute the approved 18 browser/system flows with demo accounts. Avoid
   creating irreversible business records unless the case requires a
   synthetic test record.
7. Create new output copies of both Report 5 workbooks, populate service and
   feature tabs, repair formulas, and preserve the template style.
8. Inspect formulas and representative ranges, render every sheet, fix
   clipping/layout issues, and export final `.xlsx` files.
9. Run diff/status/change-impact review. Do not stage, commit, or push unless
   explicitly requested.
