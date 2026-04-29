import { execSync } from "node:child_process";

const GIT_OPTS = { encoding: "utf8" as const };

function cachedGit(
  command: string,
  ttlMs: number,
  initial: string,
  transform: (raw: string) => string,
): { get(): string } {
  let cached = initial;
  let lastCheck = 0;
  return {
    get() {
      const now = Date.now();
      if (now - lastCheck < ttlMs) return cached;
      lastCheck = now;
      try {
        cached = transform(execSync(command, GIT_OPTS).trim());
      } catch {
        cached = initial;
      }
      return cached;
    },
  };
}

export const createBranchTracker = () =>
  cachedGit("git rev-parse --abbrev-ref HEAD", 3_000, "no-git", (s) => s);

export const createDirtyTracker = () =>
  cachedGit("git status --porcelain", 1_500, "", (s) => (s ? "*" : ""));
