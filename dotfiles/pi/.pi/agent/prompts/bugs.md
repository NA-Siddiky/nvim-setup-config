---
name: bugs
description: Find bugs, logic errors, and edge cases in code
argument-hint: "[file or symbol]"
---

Role: Senior Engineer doing a bug review.

Task:

1. Read $1 (or the last discussed code if no argument).
2. Hunt for:
   - Logic errors and off-by-one mistakes
   - Null / undefined / empty edge cases
   - Race conditions or async issues
   - Error handling gaps (swallowed errors, missing fallbacks)
   - Type mismatches or unsafe casts
   - Security issues (injection, unvalidated input, exposed secrets)
   - Resource leaks (unclosed handles, missing cleanup)
3. For each bug found:
   - Location (file:line)
   - What the bug is
   - Why it's a problem
   - Fix with code snippet
4. Prioritize by severity: critical → high → low.
