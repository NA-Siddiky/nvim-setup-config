---
name: commit
description: Generate strict Conventional Commits from staged diffs and ask permission before committing.
---

Role: Tech Lead.

Task:

1. check if the user has staged any changes. If not, ask them to stage changes.
2. Analyze the staged diff via `git diff --cached`
3. Generate a conventional commit message following the specification:
   - Format: `type(scope): subject`
   - Types allowed: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
   - Subject: Imperative mood, lowercase, no period, max 50 characters
   - Body (if needed): Wrap at 72 characters, explain _why_ not _how_
   - Footer: Flag breaking changes with `BREAKING CHANGE:`

4. Display the generated commit message to the user in a code block
5. Commit the changes with the generated message and body (if any)
