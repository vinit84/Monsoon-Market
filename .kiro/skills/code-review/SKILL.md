---
name: Code Review
description: Systematic code review practices emphasizing technical rigor, evidence-based claims, and verification. Covers receiving feedback, requesting reviews, and verification gates.
version: 1.0.0
---

# Code Review

Guide proper code review practices for Quicktube MVP.

## Core Principles

**YAGNI** - You Aren't Gonna Need It
**KISS** - Keep It Simple, Stupid
**DRY** - Don't Repeat Yourself

**Be honest, be brutal, straight to the point, and be concise.**

## Three Practices

### 1. Receiving Feedback

**Response Pattern:** READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT

**Rules:**
- ❌ No performative agreement: "You're absolutely right!", "Great point!"
- ❌ No implementation before verification
- ✅ Restate requirement, ask questions, push back with technical reasoning
- ✅ If unclear: STOP and ask for clarification first
- ✅ YAGNI check: grep for usage before implementing suggested features

### 2. Requesting Reviews

**When to Request:**
- After completing a feature or task
- Before merging to main branch
- After fixing complex bugs

**Process:**
1. Get git diff: `git diff HEAD~1`
2. Delegate to `code-reviewer` agent (Casey Morgan)
3. Act on feedback: Fix Critical immediately, Important before proceeding

### 3. Verification Gates

**Iron Law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

**Gate Function:**
1. IDENTIFY the verification command
2. RUN the full command
3. READ the output
4. VERIFY output confirms claim
5. THEN make the claim

**Red Flags - STOP:**
- Using "should"/"probably"/"seems to"
- Expressing satisfaction before verification
- Committing without verification
- ANY wording implying success without evidence

## Quicktube Review Checklist

### Security (CRITICAL)
- [ ] Auth check with `auth.getUserId(ctx)` in all mutations
- [ ] Ownership verification (never trust client IDs)
- [ ] Input validation with proper validators
- [ ] No sensitive data exposure

### Type Safety
- [ ] No `any` types (use `unknown` and narrow)
- [ ] Proper generics where applicable
- [ ] Strict null checks handled

### Performance
- [ ] Memoization where beneficial
- [ ] Proper dependency arrays in hooks
- [ ] No unnecessary re-renders

### Accessibility
- [ ] Semantic HTML elements
- [ ] ARIA attributes where needed
- [ ] Keyboard navigation support

## Review Output Format

```markdown
## Code Review: [Feature Name]

### Summary
Brief overview of changes.

### Critical (Must Fix)
- [file:line] - Issue description

### High Priority (Should Fix)
- [file:line] - Issue description

### Suggestions (Consider)
- Optional improvements

### Positive Observations
- Good patterns worth highlighting
```
