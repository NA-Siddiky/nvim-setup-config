/**
 * footer.ts
 *
 * Mirrors the pi-copy status extension pattern:
 *   - setWidget with pre-rendered string[] — NOT a render() factory
 *   - dedup guard: setWidget only called when content actually changes
 *   - zero requestRender() calls — no forced repaints mid-autocomplete
 *   - timer calls update() which deduplicates, not requestRender()
 *
 * Layout:
 *   aboveEditor:  provider  model  (thinking)        project  branch  Nt  elapsed
 *   belowEditor:  ↑in ↓out ⊕cR ⊗cW $cost  %ctx (u/t)  idle Xs      Bash 3 │ Read 5
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AssistantMessage }               from "@earendil-works/pi-ai";
import { execSync }                            from "node:child_process";
import { basename }                            from "node:path";
import { visibleWidth }                        from "@earendil-works/pi-tui";

// ── Formatting ────────────────────────────────────────────────────────────────

const FMT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const fmt = (n: number) => FMT.format(n);

function fmtElapsed(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ── Provider / model maps ─────────────────────────────────────────────────────

const R     = "\x1b[0m";
const ansi  = (code: string, text: string) => `${code}${text}${R}`;

const PROVIDERS: Record<string, { label: string; icon: string; color: string }> = {
  anthropic:           { label: "Anthropic", icon: "",   color: "\x1b[38;5;208m" },
  openai:              { label: "OpenAI",    icon: "󰚩",   color: "\x1b[38;5;142m" },
  google:              { label: "Google",    icon: "󰊭",   color: "\x1b[38;5;109m" },
  "google-gemini-cli": { label: "Google",    icon: "󰊭",   color: "\x1b[38;5;109m" },
  ollama:              { label: "Ollama",    icon: "󰳆",   color: "\x1b[38;5;108m" },
  cerebras:            { label: "Cerebras",  icon: "󰳆",   color: "\x1b[38;5;108m" },
  "github-copilot":    { label: "Copilot",   icon: "󰊤",   color: "\x1b[38;5;175m" },
  "openai-codex":      { label: "Codex",     icon: "󰚩",   color: "\x1b[38;5;214m" },
};

const MODELS: Record<string, string> = {
  "claude-opus-4-6":               "Opus 4.6",
  "claude-sonnet-4-6":             "Sonnet 4.6",
  "claude-haiku-4-5":              "Haiku 4.5",
  "gpt-5.5":                       "GPT 5.5",
  "gemini-3.1-flash-lite-preview": "Gemini 3.1 FL",
  "qwen-3-235b-a22b-instruct-2507":"Qwen 3.235b",
};

// ── Git (TTL-cached) ──────────────────────────────────────────────────────────

function makeGitCache(cmd: string, ttl: number, fallback: string, tx: (s: string) => string) {
  let v = fallback, t = 0;
  return () => {
    const now = Date.now();
    if (now - t < ttl) return v;
    t = now;
    try { v = tx(execSync(cmd, { encoding: "utf8" }).trim()); } catch { v = fallback; }
    return v;
  };
}
const gitBranch = makeGitCache("git rev-parse --abbrev-ref HEAD", 3_000, "", s => s);
const gitDirty  = makeGitCache("git status --porcelain",          1_500, "", s => s ? "*" : "");

// ── Token aggregation ─────────────────────────────────────────────────────────

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

// ── Layout ────────────────────────────────────────────────────────────────────

function buildLine(left: string, right: string): string {
  if (!right) return left;
  const w   = (process.stdout.columns ?? 80) - 2;
  const pad = Math.max(1, w - visibleWidth(left) - visibleWidth(right));
  return left + " ".repeat(pad) + right;
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  const toolCounts = new Map<string, number>();
  let cachedTotals: Totals | undefined;
  let cachedUsage:  ReturnType<ExtensionContext["getContextUsage"]>;
  let lastKey = "";
  let sessionStartAt = 0, lastActivityAt = 0, turnCount = 0, agentRunning = false;
  let idleTimer: ReturnType<typeof setInterval> | undefined;
  let savedCtx: ExtensionContext | undefined;

  function update(): void {
    if (!savedCtx) return;
    const ctx = savedCtx;
    const theme = ctx.ui.theme;
    const sep = "  ";

    // row 1 — identity
    const model   = ctx.model;
    const prov    = PROVIDERS[model?.provider ?? ""];
    const provSeg = prov
      ? ansi(prov.color, `${prov.icon} ${prov.label}`)
      : theme.fg("dim", model?.provider || "—");
    const modelSeg  = theme.fg("accent", MODELS[model?.id?.toLowerCase() ?? ""] ?? model?.id ?? "—");
    const thinking  = pi.getThinkingLevel();
    const thinkKey  = `thinking${thinking.charAt(0).toUpperCase()}${thinking.slice(1)}` as
      "thinkingOff"|"thinkingMinimal"|"thinkingLow"|"thinkingMedium"|"thinkingHigh"|"thinkingXhigh";
    const thinkSeg  = theme.fg(thinkKey, `(${thinking})`);
    const branch    = gitBranch(), dirty = gitDirty();
    const branchSeg = dirty
      ? theme.fg("warning", `\uE0A0 ${branch}${dirty}`)
      : theme.fg("muted",   `\uE0A0 ${branch || "no-git"}`);
    const turnSeg   = turnCount > 0 ? theme.fg("dim", `${turnCount}t`) : "";
    const r1L = [provSeg, modelSeg, thinkSeg].join(sep);
    const r1R = [
      theme.fg("text", `\uF07B ${basename(ctx.cwd ?? "") || "root"}`),
      branchSeg,
      ...(turnSeg ? [turnSeg] : []),
      theme.fg("dim", fmtElapsed(Date.now() - sessionStartAt)),
    ].join(sep);

    // row 2 — metrics
    cachedTotals ??= sumTotals(ctx);
    cachedUsage  ??= ctx.getContextUsage();
    const t = cachedTotals, usage = cachedUsage;
    const pct = usage?.percent ?? null;
    const pctColor: "success"|"warning"|"error" =
      pct === null || pct < 60 ? "success" : pct < 80 ? "warning" : "error";
    const idleMs = !agentRunning && lastActivityAt > 0 ? Date.now() - lastActivityAt : -1;
    const idleCol: "success"|"warning"|"error"|"dim" =
      idleMs < 0 ? "dim" :
      idleMs < 180_000 ? "success" : idleMs < 270_000 ? "warning" : idleMs < 300_000 ? "error" : "dim";
    const r2L = [
      theme.fg("dim", `↑${fmt(t.input)}`),
      theme.fg("dim", `↓${fmt(t.output)}`),
      theme.fg("dim", `⊕${fmt(t.cacheRead)}`),
      theme.fg("dim", `⊗${fmt(t.cacheWrite)}`),
      theme.fg("dim", t.cost < 0.01 ? `$${t.cost.toFixed(4)}` : `$${t.cost.toFixed(3)}`),
      theme.fg(pctColor, pct !== null ? `${Math.round(pct)}%` : "?%") +
        " " + theme.fg("dim", `(${usage?.tokens != null ? fmt(usage.tokens) : "?"}/${usage ? fmt(usage.contextWindow) : "?"})`),
      ...(idleMs >= 0 ? [theme.fg(idleCol, `idle ${fmtElapsed(idleMs)}`)] : []),
    ].join(sep);
    const r2R = toolCounts.size > 0
      ? [...toolCounts.entries()].map(([n, c]) => theme.fg("dim", `${n} ${c}`)).join(theme.fg("dim", " │ "))
      : "";

    // dedup — only call setWidget if content changed
    const key = r1L + r1R + r2L + r2R;
    if (key === lastKey) return;
    lastKey = key;

    ctx.ui.setWidget("status-top",    [buildLine(r1L, r1R)],           { placement: "aboveEditor" });
    ctx.ui.setWidget("status-bottom", [r2R ? buildLine(r2L, r2R) : r2L, ""], { placement: "belowEditor" });
  }

  // ── Events ────────────────────────────────────────────────────────────────

  pi.on("agent_start", () => { agentRunning = true; });
  pi.on("agent_end",   () => { agentRunning = false; lastActivityAt = Date.now(); update(); });
  pi.on("turn_end",    () => { turnCount++; cachedTotals = cachedUsage = undefined; update(); });
  pi.on("model_select",          () => update());
  pi.on("thinking_level_select", () => update());
  pi.on("tool_execution_start",  (event) => {
    const name = event.toolName.charAt(0).toUpperCase() + event.toolName.slice(1);
    toolCounts.set(name, (toolCounts.get(name) ?? 0) + 1);
    update();
  });
  pi.on("session_shutdown", () => { clearInterval(idleTimer); idleTimer = undefined; });

  pi.on("session_start", (_event, ctx) => {
    savedCtx = ctx;
    toolCounts.clear();
    cachedTotals = cachedUsage = undefined;
    sessionStartAt = lastActivityAt = Date.now();
    turnCount = 0; agentRunning = false; lastKey = "";

    clearInterval(idleTimer);
    idleTimer = setInterval(update, 15_000);

    ctx.ui.setFooter(() => ({ render: () => [], invalidate() {} }));
    update();
  });
}
