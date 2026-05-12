/**
 * footer.ts — Custom pi status
 *
 * aboveEditor:
 *   left  →  [provider icon] Provider  Model  (thinking)
 *   right →   project   branch
 *
 * belowEditor:
 *   left  →  ↑in  ↓out  ⊕cR  ⊗cW  $cost  [%] (used/total)
 *   right →  Bash 3 │ Read 5 │ Write 2 │ Edit 4
 *
 * footer: cleared
 *
 * Colors follow the active theme via theme.fg().
 * Provider brand colors are the only hardcoded ANSI — everything else adapts.
 *
 * Performance:
 *   - sumTotals() is O(n) over session entries; result is memoized and
 *     invalidated only on turn_end — never recomputed during idle renders.
 *   - Widgets re-render only on: turn_end, model_select,
 *     thinking_level_select, tool_execution_start.
 *   - Git branch/dirty use TTL-cached execSync (3 s / 1.5 s).
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { execSync } from "node:child_process";
import { basename } from "node:path";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

// ── Number formatting ────────────────────────────────────────────────────────

const FMT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const fmt = (n: number) => FMT.format(n);

// ── Provider brand colors (intentionally hardcoded — brand identity) ──────────

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

// ── Model short-names ────────────────────────────────────────────────────────

const MODELS: Record<string, string> = {
  "claude-opus-4-6":               "Opus 4.6",
  "claude-sonnet-4-6":             "Sonnet 4.6",
  "claude-haiku-4-5":              "Haiku 4.5",
  "gpt-5.5":                       "GPT 5.5",
  "gemini-3.1-flash-lite-preview": "Gemini 3.1 FL",
  "qwen-3-235b-a22b-instruct-2507":"Qwen 3.235b",
};

// ── ANSI helper (brand colors only) ──────────────────────────────────────────

const R = "\x1b[0m";
const brand = (ansiCode: string, text: string) => `${ansiCode}${text}${R}`;

// ── Git helpers (TTL-cached execSync) ────────────────────────────────────────

function makeGitCache(
  command: string,
  ttlMs: number,
  fallback: string,
  transform: (raw: string) => string,
): () => string {
  let cached = fallback;
  let lastAt = 0;
  return () => {
    const now = Date.now();
    if (now - lastAt < ttlMs) return cached;
    lastAt = now;
    try {
      cached = transform(execSync(command, { encoding: "utf8" }).trim());
    } catch {
      cached = fallback;
    }
    return cached;
  };
}

const gitBranch = makeGitCache("git rev-parse --abbrev-ref HEAD", 3_000, "", (s) => s);
const gitDirty  = makeGitCache("git status --porcelain",          1_500, "", (s) => (s ? "*" : ""));

// ── Token + cost aggregation (memoized — see invalidation in turn_end) ───────

interface Totals {
  input: number; output: number;
  cacheRead: number; cacheWrite: number;
  cost: number;
}

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

// ── Layout helper ─────────────────────────────────────────────────────────────

function twoSides(left: string, right: string, width: number): string {
  const gap = Math.max(1, width - visibleWidth(left) - visibleWidth(right));
  return truncateToWidth(left + " ".repeat(gap) + right, width);
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // Tool call counts — insertion-ordered, reset per session
  const toolCounts = new Map<string, number>();

  // Memoized per-turn data — invalidated on turn_end
  let cachedTotals:  Totals | undefined;
  let cachedUsage:   ReturnType<ExtensionContext["getContextUsage"]>;

  // TUI handles for event-driven re-renders
  let topTui:    { requestRender(): void } | undefined;
  let bottomTui: { requestRender(): void } | undefined;

  // ── Event handlers ────────────────────────────────────────────────────────

  pi.on("turn_end", () => {
    cachedTotals = undefined;   // invalidate memoized totals
    cachedUsage  = undefined;   // invalidate memoized context usage
    topTui?.requestRender();
    bottomTui?.requestRender();
  });

  pi.on("model_select",          () => topTui?.requestRender());
  pi.on("thinking_level_select", () => topTui?.requestRender());

  pi.on("tool_execution_start", (event) => {
    const raw  = event.toolName;
    const name = raw.charAt(0).toUpperCase() + raw.slice(1); // bash → Bash
    toolCounts.set(name, (toolCounts.get(name) ?? 0) + 1);
    bottomTui?.requestRender();
  });

  // ── Session init ──────────────────────────────────────────────────────────

  pi.on("session_start", (_event, ctx) => {
    toolCounts.clear();
    cachedTotals = undefined;
    cachedUsage  = undefined;

    // Clear the built-in footer
    ctx.ui.setFooter(() => ({
      render: () => [],
      invalidate() {},
    }));

    // ── aboveEditor: identity (provider/model/thinking) ↔ location (project/branch) ──

    ctx.ui.setWidget(
      "status-top",
      (tui, theme) => {
        topTui = tui;
        return {
          invalidate() {},
          render(width: number): string[] {
            const model      = ctx.model;
            const providerId = model?.provider ?? "";
            const provDef    = PROVIDERS[providerId];

            // Left: provider  model  (thinking)
            const provSeg = provDef
              ? brand(provDef.ansi, `${provDef.icon} ${provDef.label}`)
              : theme.fg("dim", providerId || "—");

            const modelId    = model?.id?.toLowerCase() ?? "";
            const modelLabel = MODELS[modelId] ?? modelId;
            const modelSeg   = theme.fg("accent", modelLabel || "—");

            const thinking = pi.getThinkingLevel(); // "off"|"minimal"|"low"|"medium"|"high"|"xhigh"
            const thinkKey = `thinking${thinking.charAt(0).toUpperCase()}${thinking.slice(1)}` as
              "thinkingOff" | "thinkingMinimal" | "thinkingLow" | "thinkingMedium" | "thinkingHigh" | "thinkingXhigh";
            const thinkSeg = theme.fg(thinkKey, `(${thinking})`);

            const sep  = theme.fg("dim", "  ");
            const left = [provSeg, modelSeg, thinkSeg].join(sep);

            // Right: project  branch (warning when dirty)
            const project  = basename(ctx.cwd ?? "") || "root";
            const projSeg  = theme.fg("text", `\uF07B ${project}`);

            const branch   = gitBranch();
            const dirty    = gitDirty();
            const branchSeg = dirty
              ? theme.fg("warning", `\uE0A0 ${branch}${dirty}`)
              : theme.fg("muted",   `\uE0A0 ${branch || "no-git"}`);

            const right = [projSeg, branchSeg].join(sep);

            return [twoSides(left, right, width)];
          },
        };
      },
      { placement: "aboveEditor" },
    );

    // ── belowEditor: metrics ↔ tool counts ───────────────────────────────────

    ctx.ui.setWidget(
      "status-bottom",
      (tui, theme) => {
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

            // Left: token segments
            const inSeg     = theme.fg("dim", `↑${fmt(t.input)}`);
            const outSeg    = theme.fg("dim", `↓${fmt(t.output)}`);
            const cReadSeg  = theme.fg("dim", `⊕${fmt(t.cacheRead)}`);
            const cWriteSeg = theme.fg("dim", `⊗${fmt(t.cacheWrite)}`);
            const costStr   = t.cost < 0.01 ? `$${t.cost.toFixed(4)}` : `$${t.cost.toFixed(3)}`;
            const costSeg   = theme.fg("dim", costStr);

            // Context: % in threshold color, used/total dim
            const pct      = usage?.percent ?? null;
            const pctLabel = pct !== null ? `${Math.round(pct)}%` : "?%";
            const pctColor: "success" | "warning" | "error" =
              pct === null || pct < 60 ? "success" : pct < 80 ? "warning" : "error";
            const usedStr  = usage?.tokens != null ? fmt(usage.tokens) : "?";
            const totalStr = usage ? fmt(usage.contextWindow) : "?";
            const ctxSeg   =
              theme.fg(pctColor, pctLabel) +
              " " +
              theme.fg("dim", `(${usedStr}/${totalStr})`);

            const left = [inSeg, outSeg, cReadSeg, cWriteSeg, costSeg, ctxSeg].join(sep);

            // Right: tool counts (only non-zero, insertion order)
            if (toolCounts.size === 0) {
              return [truncateToWidth(left, width), ""];
            }

            const toolSep   = theme.fg("dim", " │ ");
            const toolParts = [...toolCounts.entries()].map(
              ([name, count]) =>
                theme.fg("dim", `${name} ${count}`),
            );
            const right = toolParts.join(toolSep);

            return [twoSides(left, right, width), ""];
          },
        };
      },
      { placement: "belowEditor" },
    );
  });
}
