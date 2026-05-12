/**
 * footer.ts — Custom pi status
 *
 * aboveEditor (left):   provider  model  (thinking)
 * aboveEditor (right):   project   branch  Nt  elapsed
 *
 * belowEditor (left):   ↑in  ↓out  ⊕cR  ⊗cW  $cost  %ctx (used/total)  idle Xs
 * belowEditor (right):  Bash 3 │ Read 5 │ Write 2 │ Edit 4
 *
 * footer: cleared
 *
 * Colors via theme.fg() throughout; only provider brand colors are hardcoded.
 *
 * Performance:
 *   - sumTotals() memoized, invalidated on turn_end only
 *   - getContextUsage() memoized, invalidated on turn_end only
 *   - Idle timer fires every 15 s, skipped while agent is running
 *   - Git branch/dirty: TTL-cached execSync (3 s / 1.5 s)
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AssistantMessage }               from "@earendil-works/pi-ai";
import { execSync }                            from "node:child_process";
import { basename }                            from "node:path";
import { truncateToWidth, visibleWidth }       from "@earendil-works/pi-tui";

// ── Number formatting ─────────────────────────────────────────────────────────

const FMT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const fmt = (n: number) => FMT.format(n);

// ── Provider brand colors (hardcoded intentionally — brand identity) ──────────

const PROVIDERS: Record<string, { label: string; icon: string; ansi: string }> = {
  anthropic:           { label: "Anthropic", icon: "",   ansi: "\x1b[38;5;208m" },
  openai:              { label: "OpenAI",    icon: "󰚩",   ansi: "\x1b[38;5;142m" },
  google:              { label: "Google",    icon: "󰊭",   ansi: "\x1b[38;5;109m" },
  "google-gemini-cli": { label: "Google",    icon: "󰊭",   ansi: "\x1b[38;5;109m" },
  ollama:              { label: "Ollama",    icon: "󰳆",   ansi: "\x1b[38;5;108m" },
  cerebras:            { label: "Cerebras",  icon: "󰳆",   ansi: "\x1b[38;5;108m" },
  "github-copilot":    { label: "Copilot",   icon: "󰊤",   ansi: "\x1b[38;5;175m" },
  "openai-codex":      { label: "Codex",     icon: "󰚩",   ansi: "\x1b[38;5;214m" },
};

// ── Model short-names ─────────────────────────────────────────────────────────

const MODELS: Record<string, string> = {
  "claude-opus-4-6":               "Opus 4.6",
  "claude-sonnet-4-6":             "Sonnet 4.6",
  "claude-haiku-4-5":              "Haiku 4.5",
  "gpt-5.5":                       "GPT 5.5",
  "gemini-3.1-flash-lite-preview": "Gemini 3.1 FL",
  "qwen-3-235b-a22b-instruct-2507":"Qwen 3.235b",
};

// ── ANSI helper (brand colors only) ──────────────────────────────────────────

const R     = "\x1b[0m";
const brand = (code: string, text: string) => `${code}${text}${R}`;

// ── Git helpers (TTL-cached execSync) ─────────────────────────────────────────

function makeGitCache(
  cmd: string, ttlMs: number, fallback: string, transform: (s: string) => string,
): () => string {
  let cached = fallback, lastAt = 0;
  return () => {
    const now = Date.now();
    if (now - lastAt < ttlMs) return cached;
    lastAt = now;
    try { cached = transform(execSync(cmd, { encoding: "utf8" }).trim()); }
    catch { cached = fallback; }
    return cached;
  };
}

const gitBranch = makeGitCache("git rev-parse --abbrev-ref HEAD", 3_000, "",  s => s);
const gitDirty  = makeGitCache("git status --porcelain",          1_500, "",  s => s ? "*" : "");

// ── Token + cost aggregation (memoized per turn) ──────────────────────────────

interface Totals { input: number; output: number; cacheRead: number; cacheWrite: number; cost: number }

function sumTotals(ctx: ExtensionContext): Totals {
  const t: Totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };
  for (const e of ctx.sessionManager.getBranch()) {
    if (e.type === "message" && e.message.role === "assistant") {
      const m = e.message as AssistantMessage;
      t.input      += m.usage.input;
      t.output     += m.usage.output;
      t.cacheRead  += m.usage.cacheRead  ?? 0;
      t.cacheWrite += m.usage.cacheWrite ?? 0;
      t.cost       += m.usage.cost.total ?? 0;
    }
  }
  return t;
}

// ── Elapsed time formatter ────────────────────────────────────────────────────

function fmtElapsed(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ── Layout helper ─────────────────────────────────────────────────────────────

function twoSides(left: string, right: string, width: number): string {
  const gap = Math.max(1, width - visibleWidth(left) - visibleWidth(right));
  return truncateToWidth(left + " ".repeat(gap) + right, width);
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // Tool counts — insertion-ordered, reset per session
  const toolCounts = new Map<string, number>();

  // Memoized per-turn data — invalidated on turn_end
  let cachedTotals: Totals | undefined;
  let cachedUsage:  ReturnType<ExtensionContext["getContextUsage"]>;

  // TUI handles for event-driven re-renders
  let topTui:    { requestRender(): void } | undefined;
  let bottomTui: { requestRender(): void } | undefined;

  // Session timing + idle tracking
  let sessionStartAt = 0;
  let lastActivityAt = 0;
  let turnCount      = 0;
  let agentRunning   = false;
  let idleTimer: ReturnType<typeof setInterval> | undefined;

  // ── Events ───────────────────────────────────────────────────────────────

  pi.on("agent_start", () => {
    agentRunning = true;
  });

  pi.on("agent_end", () => {
    agentRunning   = false;
    lastActivityAt = Date.now();
    bottomTui?.requestRender();
  });

  pi.on("turn_end", () => {
    turnCount++;
    cachedTotals = undefined;
    cachedUsage  = undefined;
    topTui?.requestRender();
    bottomTui?.requestRender();
  });

  pi.on("model_select",          () => topTui?.requestRender());
  pi.on("thinking_level_select", () => topTui?.requestRender());

  pi.on("session_shutdown", () => {
    if (idleTimer) { clearInterval(idleTimer); idleTimer = undefined; }
  });

  pi.on("tool_execution_start", (event) => {
    const name = event.toolName.charAt(0).toUpperCase() + event.toolName.slice(1);
    toolCounts.set(name, (toolCounts.get(name) ?? 0) + 1);
    bottomTui?.requestRender();
  });

  // ── Session init ──────────────────────────────────────────────────────────

  pi.on("session_start", (_event, ctx) => {
    toolCounts.clear();
    cachedTotals   = undefined;
    cachedUsage    = undefined;
    sessionStartAt = Date.now();
    lastActivityAt = Date.now();
    turnCount      = 0;
    agentRunning   = false;

    // 15-second idle ticker — skipped while agent is running
    if (idleTimer) clearInterval(idleTimer);
    idleTimer = setInterval(() => {
      if (!agentRunning) bottomTui?.requestRender();
    }, 15_000);

    // Clear the built-in footer
    ctx.ui.setFooter(() => ({ render: () => [], invalidate() {} }));

    // ── aboveEditor: identity ↔ location + session meta ───────────────────

    ctx.ui.setWidget("status-top", (tui, theme) => {
      topTui = tui;
      return {
        invalidate() {},
        render(width: number): string[] {
          const model      = ctx.model;
          const providerId = model?.provider ?? "";
          const provDef    = PROVIDERS[providerId];
          const provSeg    = provDef
            ? brand(provDef.ansi, `${provDef.icon} ${provDef.label}`)
            : theme.fg("dim", providerId || "—");

          const modelId    = model?.id?.toLowerCase() ?? "";
          const modelLabel = MODELS[modelId] ?? modelId;
          const modelSeg   = theme.fg("accent", modelLabel || "—");

          const thinking = pi.getThinkingLevel();
          const thinkKey = `thinking${thinking.charAt(0).toUpperCase()}${thinking.slice(1)}` as
            "thinkingOff"|"thinkingMinimal"|"thinkingLow"|"thinkingMedium"|"thinkingHigh"|"thinkingXhigh";
          const thinkSeg = theme.fg(thinkKey, `(${thinking})`);

          const sep  = theme.fg("dim", "  ");
          const left = [provSeg, modelSeg, thinkSeg].join(sep);

          // Right: project  branch  Nt  elapsed
          const project     = basename(ctx.cwd ?? "") || "root";
          const projSeg     = theme.fg("text",  `\uF07B ${project}`);
          const branch      = gitBranch();
          const dirty       = gitDirty();
          const branchSeg   = dirty
            ? theme.fg("warning", `\uE0A0 ${branch}${dirty}`)
            : theme.fg("muted",   `\uE0A0 ${branch || "no-git"}`);
          const sessionSeg  = theme.fg("dim", fmtElapsed(Date.now() - sessionStartAt));
          const turnSeg     = turnCount > 0 ? theme.fg("dim", `${turnCount}t`) : "";
          const rightParts  = [projSeg, branchSeg, ...(turnSeg ? [turnSeg] : []), sessionSeg];
          const right       = rightParts.join(sep) + " ";

          return [twoSides(left, right, width)];
        },
      };
    }, { placement: "aboveEditor" });

    // ── belowEditor: metrics + idle ↔ tool counts ─────────────────────────

    ctx.ui.setWidget("status-bottom", (tui, theme) => {
      bottomTui = tui;
      return {
        invalidate() {},
        render(width: number): string[] {
          // Memoized — only recomputed after turn_end
          cachedTotals ??= sumTotals(ctx);
          cachedUsage  ??= ctx.getContextUsage();
          const t     = cachedTotals;
          const usage = cachedUsage;

          const sep = theme.fg("dim", "  ");

          // Token + cost segments
          const inSeg     = theme.fg("dim", `↑${fmt(t.input)}`);
          const outSeg    = theme.fg("dim", `↓${fmt(t.output)}`);
          const cReadSeg  = theme.fg("dim", `⊕${fmt(t.cacheRead)}`);
          const cWriteSeg = theme.fg("dim", `⊗${fmt(t.cacheWrite)}`);
          const costSeg   = theme.fg("dim", t.cost < 0.01 ? `$${t.cost.toFixed(4)}` : `$${t.cost.toFixed(3)}`);

          // Context %
          const pct      = usage?.percent ?? null;
          const pctColor: "success"|"warning"|"error" =
            pct === null || pct < 60 ? "success" : pct < 80 ? "warning" : "error";
          const ctxSeg =
            theme.fg(pctColor, pct !== null ? `${Math.round(pct)}%` : "?%") +
            " " +
            theme.fg("dim", `(${usage?.tokens != null ? fmt(usage.tokens) : "?"}/${usage ? fmt(usage.contextWindow) : "?"})`);

          // Idle time — color-coded against Anthropic's 5-min cache TTL:
          //   < 3 min  → success  (cache warm)
          //   3–4.5 min → warning  (getting old)
          //   4.5–5 min → error    (almost cold!)
          //   > 5 min  → dim      (cache gone, no urgency)
          const idleSegs: string[] = [];
          if (!agentRunning && lastActivityAt > 0) {
            const idleMs  = Date.now() - lastActivityAt;
            const idleCol: "success"|"warning"|"error"|"dim" =
              idleMs < 180_000 ? "success" :
              idleMs < 270_000 ? "warning" :
              idleMs < 300_000 ? "error"   : "dim";
            idleSegs.push(theme.fg(idleCol, `idle ${fmtElapsed(idleMs)}`));
          }

          const left = [inSeg, outSeg, cReadSeg, cWriteSeg, costSeg, ctxSeg, ...idleSegs].join(sep);

          // Right: tool counts
          if (toolCounts.size === 0) return [truncateToWidth(left, width), ""];

          const toolSep   = theme.fg("dim", " │ ");
          const toolParts = [...toolCounts.entries()].map(
            ([name, count]) => theme.fg("dim", `${name} ${count}`),
          );
          const right = toolParts.join(toolSep) + " ";

          return [twoSides(left, right, width), ""];
        },
      };
    }, { placement: "belowEditor" });
  });
}
