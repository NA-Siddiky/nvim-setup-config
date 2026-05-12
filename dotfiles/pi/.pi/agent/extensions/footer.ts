/**
 * footer.ts — replicates the pi-copy status extension structure exactly.
 *
 * Same pattern: setWidget with pre-rendered string[], dedup guard,
 * no requestRender(), update() called from events only (+ idle timer).
 *
 * aboveEditor:  [provider icon] Provider  Model  (thinking)        project   branch
 * belowEditor:  ↑in  ↓out  ⊕cR  ⊗cW  $cost  45% (50K/200K)  idle 2m    Bash 3 │ Read 5
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AssistantMessage }               from "@earendil-works/pi-ai";
import { execSync }                            from "node:child_process";
import { basename }                            from "node:path";

// ── Formatting ────────────────────────────────────────────────────────────────

const FMT  = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const fmt  = (n: number) => FMT.format(n);
const R    = "\x1b[0m";
const ansi = (code: string, text: string) => `${code}${text}${R}`;
const bold = (code: string, text: string) => `\x1b[1m${code}${text}${R}`;

function fmtElapsed(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function buildLine(left: string, right: string): string {
  if (!right) return left;
  const w   = (process.stdout.columns ?? 80) - 4;
  const pad = Math.max(1, w - stripAnsi(left).length - stripAnsi(right).length);
  return left + " ".repeat(pad) + right;
}

// ── Provider / model ──────────────────────────────────────────────────────────

const PROVIDERS: Record<string, { name: string; icon: string; color: string }> = {
  anthropic:           { name: "Anthropic", icon: "",   color: "\x1b[38;5;208m" },
  openai:              { name: "OpenAI",    icon: "󰚩",   color: "\x1b[38;5;142m" },
  google:              { name: "Google",    icon: "󰊭",   color: "\x1b[38;5;109m" },
  "google-gemini-cli": { name: "Google",    icon: "󰊭",   color: "\x1b[38;5;109m" },
  ollama:              { name: "Ollama",    icon: "󰳆",   color: "\x1b[38;5;108m" },
  cerebras:            { name: "Cerebras",  icon: "󰳆",   color: "\x1b[38;5;108m" },
  "github-copilot":    { name: "Copilot",   icon: "󰊤",   color: "\x1b[38;5;175m" },
  "openai-codex":      { name: "Codex",     icon: "󰚩",   color: "\x1b[38;5;214m" },
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

// ── Extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  const toolCounts  = new Map<string, number>();
  let cachedTotals: Totals | undefined;
  let cachedUsage:  ReturnType<ExtensionContext["getContextUsage"]>;
  let lastKey       = "";
  let lastActivityAt = 0;
  let agentRunning   = false;
  let idleTimer: ReturnType<typeof setInterval> | undefined;
  let savedCtx: ExtensionContext | undefined;

  // ── Core update — identical to pi-copy pattern ───────────────────────────

  function update(): void {
    if (!savedCtx) return;
    const ctx = savedCtx;

    // row 1 — identity (same structure as pi copy topLeft / topRight)
    const model   = ctx.model;
    const prov    = PROVIDERS[model?.provider ?? ""];
    const provSeg = prov
      ? ansi(prov.color, `${prov.icon} ${prov.name}`)
      : "";
    const modelId    = model?.id?.toLowerCase() ?? "";
    const modelLabel = MODELS[modelId] ?? modelId;
    const modelSeg   = bold("\x1b[38;5;117m", modelLabel || "—");
    const thinking   = pi.getThinkingLevel();
    const thinkSeg   = ansi("\x1b[38;5;246m", `(${thinking})`);

    const topLeft  = [provSeg, modelSeg, thinkSeg].filter(Boolean).join("  ");
    const branch   = gitBranch(), dirty = gitDirty();
    const topRight = [
      ansi("\x1b[38;5;179m", `\uF07B ${basename(ctx.cwd ?? "") || "root"}`),
      ansi(dirty ? "\x1b[38;5;214m" : "\x1b[38;5;246m", `\uE0A0 ${branch || "no-git"}${dirty}`),
    ].join("  ");

    // row 2 — metrics
    cachedTotals ??= sumTotals(ctx);
    cachedUsage  ??= ctx.getContextUsage();
    const t     = cachedTotals;
    const usage = cachedUsage;
    const pct   = usage?.percent ?? null;

    const pctColor =
      pct === null || pct < 60 ? "\x1b[38;5;142m" :
      pct < 80                 ? "\x1b[38;5;214m" : "\x1b[38;5;196m";

    const metricsLeft = [
      ansi("\x1b[38;5;246m", `↑${fmt(t.input)}`),
      ansi("\x1b[38;5;246m", `↓${fmt(t.output)}`),
      ansi("\x1b[38;5;240m", `⊕${fmt(t.cacheRead)}`),
      ansi("\x1b[38;5;240m", `⊗${fmt(t.cacheWrite)}`),
      ansi("\x1b[38;5;246m", t.cost < 0.01 ? `$${t.cost.toFixed(4)}` : `$${t.cost.toFixed(3)}`),
      ansi(pctColor, pct !== null ? `${Math.round(pct)}%` : "?%") +
        " " + ansi("\x1b[38;5;240m", `(${usage?.tokens != null ? fmt(usage.tokens) : "?"}/${usage ? fmt(usage.contextWindow) : "?"})`),
    ].join("  ");

    // idle time — color against Anthropic 5-min cache TTL
    const idleMs  = !agentRunning && lastActivityAt > 0 ? Date.now() - lastActivityAt : -1;
    const idleSeg = idleMs >= 0 ? (() => {
      const col =
        idleMs < 180_000 ? "\x1b[38;5;142m" :  // < 3m  green
        idleMs < 270_000 ? "\x1b[38;5;214m" :  // 3–4.5m orange
        idleMs < 300_000 ? "\x1b[38;5;196m" :  // 4.5–5m red
        "\x1b[38;5;240m";                        // > 5m  dim
      return ansi(col, `idle ${fmtElapsed(idleMs)}`);
    })() : "";

    const metricsRight = toolCounts.size > 0
      ? [...toolCounts.entries()].map(([n, c]) => ansi("\x1b[38;5;246m", `${n} ${c}`)).join(ansi("\x1b[38;5;240m", " │ "))
      : "";

    const bottomLeft = idleSeg ? metricsLeft + "  " + idleSeg : metricsLeft;

    // dedup — only call setWidget if something actually changed
    const key = topLeft + topRight + bottomLeft + metricsRight;
    if (key === lastKey) return;
    lastKey = key;

    ctx.ui.setWidget("status-top",    [buildLine(topLeft, topRight)],           { placement: "aboveEditor" });
    ctx.ui.setWidget("status-bottom", [buildLine(bottomLeft, metricsRight)],    { placement: "belowEditor" });
  }

  // ── Events (same set as pi copy + agent_end for idle) ────────────────────

  pi.on("agent_start", () => { agentRunning = true; });
  pi.on("agent_end",   () => { agentRunning = false; lastActivityAt = Date.now(); update(); });
  pi.on("turn_end",    () => { cachedTotals = cachedUsage = undefined; update(); });
  pi.on("model_select",          () => update());
  pi.on("thinking_level_select", () => update());
  pi.on("tool_execution_start",  (event) => {
    toolCounts.set(event.toolName, (toolCounts.get(event.toolName) ?? 0) + 1);
    update();
  });
  pi.on("session_shutdown", () => { clearInterval(idleTimer); idleTimer = undefined; });

  pi.on("session_start", (_event, ctx) => {
    savedCtx = ctx;
    toolCounts.clear();
    cachedTotals = cachedUsage = undefined;
    lastActivityAt = 0; agentRunning = false; lastKey = "";

    // Idle timer — only updates idle label, dedup prevents unnecessary setWidget calls
    clearInterval(idleTimer);
    idleTimer = setInterval(() => { if (!agentRunning) update(); }, 30_000);

    ctx.ui.setFooter(() => ({ render: () => [], invalidate() {} }));
    update();
  });
}
