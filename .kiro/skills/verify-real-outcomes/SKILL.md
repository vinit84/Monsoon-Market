---
name: verify-real-outcomes
description: Prevents agents from treating proxy signals like green tests, polished demos, or finished reports as success when the real system may still be broken. Use when validating AI-generated fixes, writing or reviewing tests, checking "done" or "production ready" claims, or when a passing metric may hide an unsolved problem.
---

# Verify Real Outcomes

Use this skill when a task can appear successful without actually being solved.

## Quick Start

Before implementing or signing off, state:
- Real outcome: the user-visible behavior or system state that must be true
- Proxy metric: tests, screenshots, dashboards, demos, reports
- Failure mode: how the metric could go green while the system stays broken

Treat proxy metrics as evidence, not success itself.

## Workflow

### 1. Define the real win
- Describe the requirement in observable terms.
- Name the source of truth.
- Name the proxy metric separately.

### 2. Look for metric-gaming paths
- Test-only conditionals or runtime patches
- Mocked collaborators that bypass the broken path
- DOM or state mutation performed only during tests
- Hardcoded outputs, seeded data, or bypassed validation
- Demo-specific flows that skip normal behavior

### 3. Verify through independent evidence
- Reproduce the failure before fixing it.
- Validate through the public interface the user actually depends on.
- Add at least one check the implementation cannot trivially fake.
- When risk is high, use two kinds of evidence:
  - user-facing behavior
  - persisted, external, or side-effect evidence

### 4. Reject fake greens
Do not claim success if:
- tests pass only because the harness changed
- the fix works only in test or demo mode
- assertions no longer cover the original failure
- the broken behavior still exists outside the instrumented path

### 5. Sign off carefully
Only say `fixed`, `done`, or `production ready` when:
- the original failure is gone
- the real outcome is verified
- the regression test would fail without the fix
- no test-only patch is carrying the behavior

For concrete examples, see [REFERENCE.md](REFERENCE.md).

## Heuristics

If the task is about:
- UI: verify in a browser path, not only component tests
- API: verify the response and the side effect
- Data or reports: reconcile output against source data
- Automation: inspect what changed in the target system
- Demo flows: exercise at least one unhappy path too

## Output Pattern

When reporting results, separate:
- Outcome verified
- Proxy signals passed
- Residual risks
