---
name: Debugging
description: Systematic debugging framework ensuring root cause investigation before fixes. Includes four-phase debugging process, backward call stack tracing, multi-layer validation, and verification protocols.
version: 1.0.0
languages: all
---

# Debugging

Comprehensive debugging framework for Quicktube MVP.

## Core Principle

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**

Random fixes waste time and create new bugs. Find the root cause, fix at source, validate at every layer, verify before claiming success.

## When to Use

**Always use for:** Test failures, bugs, unexpected behavior, performance issues, build failures, integration problems, before claiming work complete

## The Four Phases

### Phase 1: Root Cause Investigation
1. Read the COMPLETE error message/stack trace
2. Reproduce the issue reliably
3. Check recent changes (git log, git diff)
4. Gather evidence before theorizing

### Phase 2: Pattern Analysis
1. Find a working example in the codebase
2. Compare working vs broken code
3. Identify the exact difference
4. Document the pattern

### Phase 3: Hypothesis and Testing
1. Form a clear theory of what's wrong
2. Test minimally (one change at a time)
3. Verify the theory explains ALL symptoms
4. Don't proceed until hypothesis confirmed

### Phase 4: Implementation
1. Write a test that reproduces the bug
2. Fix at the source (not at symptom)
3. Verify test passes
4. Run full test suite

## Quicktube-Specific Debugging

### Convex Issues
```bash
# Check Convex logs
npx convex logs

# Verify schema
npx convex dev
```

### Auth Issues
- Always check `auth.getUserId(ctx)` returns valid user
- Verify ownership checks in mutations
- Check HTTP-only cookie flow for OAuth

### Build Issues
```bash
# Type check
npx tsc --noEmit

# Full build
npm run build
```

## Red Flags - STOP and Follow Process

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- "Should work now" / "Seems fixed"
- "Tests pass, we're done"

**All mean:** Return to systematic process.

## Verification Protocol

**Iron Law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

1. Run the verification command
2. Read the actual output
3. Confirm it shows success
4. THEN claim the result
