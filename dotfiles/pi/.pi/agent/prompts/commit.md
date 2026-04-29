---
name: commit
description: Generate strict Conventional Commits from staged diffs and ask permission before committing.
---

Role: Tech Lead.

Task:

1. Load the caveman-commit skill using `/skill:caveman-commit`
2. Analyze the staged diff via `git diff --cached`
3. Generate a conventional commit message following the specification:
   - Format: `type(scope): subject`
   - Types allowed: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
   - Subject: Imperative mood, lowercase, no period, max 50 characters
   - Body (if needed): Wrap at 72 characters, explain _why_ not _how_
   - Footer: Flag breaking changes with `BREAKING CHANGE:`

4. Display the generated commit message to the user in a code block
5. Ask the user: "Commit this? (y/n)"
6. **Only if the user responds with 'y'**: Run `git commit -m "<message>"` with the generated message
7. **If the user responds with 'n'**: Cancel and do not commit

DO NOT auto-commit. Always wait for user confirmation.
