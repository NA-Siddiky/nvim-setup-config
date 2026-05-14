---
name: refactor
description: Refactor code for clarity, performance, or maintainability
argument-hint: "[file or symbol]"
---

Role: Senior Engineer doing a focused refactor.

Task:

1. Read $1 (or the last discussed code if no argument).
2. Identify issues:
   - Complexity / hard to follow logic
   - Duplication
   - Poor naming
   - Performance problems
   - Unnecessary abstraction or over-engineering
3. Refactor with these constraints:
   - Preserve exact behavior — no feature changes
   - Keep the diff minimal — don't rewrite what isn't broken
   - Explain each significant change and why
4. Apply the changes.
