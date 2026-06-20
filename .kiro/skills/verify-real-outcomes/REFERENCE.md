# Verify Real Outcomes Reference

## Common fake-green patterns

### Tests pass, product still broken
- Runtime DOM patching or injected handlers only in the test path
- Assertions moved from user-visible behavior to internal state
- Broad mocks that skip the failing integration
- Snapshot updates hiding behavioral regressions

### Demo works, system does not
- Seeded data that never exists in production
- Hardcoded API responses or local fallbacks
- Feature flags forced on only for the demo path
- Manual setup steps omitted from the claimed workflow

### Report finished, underlying data still wrong
- Presentation layer reformats bad inputs cleanly
- Aggregates reconcile internally but not against source data
- Missing rows or failed jobs are excluded from the final output

## Verification upgrades

When a result could be faked, add one stronger check:
- UI: verify the browser path a real user takes
- API: verify both response and persisted side effect
- Jobs: verify downstream artifact or state transition
- Reports: reconcile against source records
- Automations: verify target-system changes, not just logs

## Review prompts

Use these questions before signing off:
- What exact user-visible problem is now gone?
- What evidence comes from outside the test harness?
- If I remove the fix, does the regression test fail for the right reason?
- Could this still pass if the app were broken in production?

## Reporting pattern

Prefer:
- Outcome verified: what changed in the real system
- Proxy signals: tests, screenshots, metrics, demos
- Residual risk: what was not independently verified

Avoid:
- "Tests are green, so this is fixed."
- "The demo worked, so it is production ready."
