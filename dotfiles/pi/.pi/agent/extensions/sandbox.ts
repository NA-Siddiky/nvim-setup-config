/**
 * sandbox.ts
 *
 * Blocks write/edit tool calls and bash commands that target paths outside
 * the current working directory. Hard enforcement — no prompt-only reliance.
 *
 * Bash patterns intercepted:
 *   - output redirects:    cmd > /abs/path  |  cmd >> /abs/path
 *   - tee:                 tee [-a] /abs/path
 *   - cp / mv:             cp src /abs/dest  |  mv src /abs/dest
 *   - ln:                  ln [-s] /abs/src /abs/dest
 *   - install:             install ... /abs/dest
 *
 * Only absolute paths are checked — relative paths inside bash are
 * resolved by the shell against cwd so they're already safe.
 */

import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { resolve } from "node:path";

// ── helpers ──────────────────────────────────────────────────────────────────

function isOutside(cwd: string, filePath: string): boolean {
  const abs = resolve(cwd, filePath);
  return abs !== cwd && !abs.startsWith(cwd + "/");
}

/**
 * Extract absolute paths that would be written to by a bash command.
 * Returns [path, pattern_label] pairs so the block reason is descriptive.
 */
function bashWriteTargets(cmd: string): Array<{ path: string; via: string }> {
  const hits: Array<{ path: string; via: string }> = [];

  const push = (path: string, via: string) => {
    // Only flag absolute paths — relative ones are safe (shell resolves to cwd)
    if (path.startsWith("/")) hits.push({ path, via });
  };

  // output redirects: > /path  or  >> /path
  // negative lookbehind for < to avoid matching <<
  for (const m of cmd.matchAll(/(?<![<])>{1,2}\s*(\/[^\s;|&'"]+)/g)) {
    push(m[1], "redirect");
  }

  // tee: tee [-flags] /path  or  tee /path [-flags] (any token that looks like abs path)
  for (const m of cmd.matchAll(/\btee\b[^;|&\n]*(\/[^\s;|&'"]+)/g)) {
    push(m[1], "tee");
  }

  // cp / mv: last absolute path token in the argument list (destination)
  for (const m of cmd.matchAll(
    /\b(?:cp|mv)\b(?:\s+-\S+)*\s+\S+\s+(\/[^\s;|&'"]+)/g,
  )) {
    push(m[1], m[0].trimStart().startsWith("cp") ? "cp" : "mv");
  }

  // ln: ln [-s] /src /dest — the last absolute path is the destination
  for (const m of cmd.matchAll(
    /\bln\b(?:\s+-\S+)*(?:\s+\/[^\s;|&'"]+)?\s+(\/[^\s;|&'"]+)/g,
  )) {
    push(m[1], "ln");
  }

  // install: install [flags] src... /dest — last absolute path token
  for (const m of cmd.matchAll(
    /\binstall\b[^;|&\n]*(\/[^\s;|&'"]+)(?=\s*(?:;|&&|\|\||$))/g,
  )) {
    push(m[1], "install");
  }

  return hits;
}

// ── extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    const cwd = ctx.cwd;

    // ── write ──
    if (isToolCallEventType("write", event)) {
      if (isOutside(cwd, event.input.path)) {
        return {
          block: true,
          reason: `Blocked: write to "${event.input.path}" is outside cwd (${cwd})`,
        };
      }
    }

    // ── edit ──
    if (isToolCallEventType("edit", event)) {
      if (isOutside(cwd, event.input.path)) {
        return {
          block: true,
          reason: `Blocked: edit of "${event.input.path}" is outside cwd (${cwd})`,
        };
      }
    }

    // ── bash ──
    if (isToolCallEventType("bash", event)) {
      const targets = bashWriteTargets(event.input.command);
      const violations = targets.filter((t) => isOutside(cwd, t.path));
      if (violations.length > 0) {
        const detail = violations
          .map((v) => `"${v.path}" (via ${v.via})`)
          .join(", ");
        return {
          block: true,
          reason: `Blocked: bash command would write outside cwd (${cwd}): ${detail}`,
        };
      }
    }
  });
}
