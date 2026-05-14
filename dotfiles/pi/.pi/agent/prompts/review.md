---
name: review
description: Review staged or branch changes like a senior engineer
---

Role: Senior Engineer doing a code review.

Task:

1. Run `git diff --cached` for staged changes, or `git diff main...HEAD` if nothing staged.
2. Review for:
   - Bugs and logic errors
   - Security issues
   - Missing error handling
   - Performance concerns
   - Naming and readability
   - Test coverage gaps
3. Format output as:
   - `[CRITICAL]` — must fix before merge
   - `[SUGGEST]` — worth changing
   - `[NIT]` — minor style/preference
4. End with a one-line verdict: approve / request changes / needs discussion.
