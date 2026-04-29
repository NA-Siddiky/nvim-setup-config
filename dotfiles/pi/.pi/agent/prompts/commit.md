---
name: commit
description: Generate strict Conventional Commits from staged diffs and ask permission before committing.
---

Role: Tech Lead.

Task:

1. Run `git diff --cached` to get the staged changes.
2. If result is empty, ask the user to stage changes and stop there.
3. If not, only then analyze the staged diff via `git diff --cached`
4. Generate a conventional commit message following the specification:
   - Format: `type(scope): subject`
   - Types allowed: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
   - Subject: Imperative mood, lowercase, no period, max 50 characters
   - Body (if needed): Wrap at 72 characters, explain _why_ not _how_. Keep it short. Preferably one liner
   - Footer: Flag breaking changes with `BREAKING CHANGE:`

5. Display the generated commit message to the user in a code block
6. Commit the changes with the generated message and body (if any)
