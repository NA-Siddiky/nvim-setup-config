import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AssistantMessage }               from "@earendil-works/pi-ai";
import { execSync }                            from "node:child_process";
import { basename }                            from "node:path";
import { truncateToWidth, visibleWidth }       from "@earendil-works/pi-tui";

const FMT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const fmt = (n: number) => FMT.format(n);

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

const MODELS: Record<string, string> = {
  "claude-opus-4-6":               "Opus 4.6",
  "claude-sonnet-4-6":             "Sonnet 4.6",
  "claude-haiku-4-5":              "Haiku 4.5",
  "gpt-5.5":                       "GPT 5.5",
  "gemini-3.1-flash-lite-preview": "Gemini 3.1 FL",
  "qwen-3-235b-a22b-instruct-2507":"Qwen 3.235b",
};

const R     = "\x1b[0m";
const brand = (code: string, text: string) => `${code}${text}${R}`;

let _dirty = "", _dirtyAt = 0;
function gitDirty(): string {
  const now = Date.now();
  if (now - _dirtyAt < 1_500) return _dirty;
  _dirtyAt = now;
  try { _dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim() ? "*" : ""; }
  catch { _dirty = ""; }
  return _dirty;
}

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

function fmtElapsed(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function twoSides(left: string, right: string, width: number): string {
  const gap = Math.max(1, width - visibleWidth(left) - visibleWidth(right));
  return truncateToWidth(left + " ".repeat(gap) + right, width);
}

export default function (pi: ExtensionAPI) {
  const toolCounts = new Map<string, number>();
  let cachedTotals: Totals | undefined;
  let cachedUsage:  ReturnType<ExtensionContext["getContextUsage"]>;
  let requestRender: (() => void) | undefined;
  let sessionStartAt = 0, lastActivityAt = 0, turnCount = 0;
  let agentRunning = false;
  let idleTimer: ReturnType<typeof setInterval> | undefined;

  pi.on("agent_start", () => { agentRunning = true; });
  pi.on("agent_end",   () => { agentRunning = false; lastActivityAt = Date.now(); requestRender?.(); });
  pi.on("turn_end",    () => { turnCount++; cachedTotals = undefined; cachedUsage = undefined; requestRender?.(); });
  pi.on("model_select",          () => requestRender?.());
  pi.on("thinking_level_select", () => requestRender?.());
  pi.on("tool_execution_start",  (event) => {
    const name = event.toolName.charAt(0).toUpperCase() + event.toolName.slice(1);
    toolCounts.set(name, (toolCounts.get(name) ?? 0) + 1);
    requestRender?.();
  });
  pi.on("session_shutdown", () => { clearInterval(idleTimer); idleTimer = undefined; });

  pi.on("session_start", (_event, ctx) => {
    toolCounts.clear();
    cachedTotals = cachedUsage = undefined;
    sessionStartAt = lastActivityAt = Date.now();
    turnCount = 0;
    agentRunning = false;

    clearInterval(idleTimer);
    idleTimer = setInterval(() => { if (!agentRunning) requestRender?.(); }, 15_000);

    ctx.ui.setFooter((tui, theme, footerData) => {
      requestRender = () => tui.requestRender();
      const unsub = footerData.onBranchChange(() => tui.requestRender());

      return {
        dispose: unsub,
        invalidate() {},
        render(width: number): string[] {
          const sep = theme.fg("dim", "  ");

          // row 1 — identity
          const model      = ctx.model;
          const provDef    = PROVIDERS[model?.provider ?? ""];
          const provSeg    = provDef
            ? brand(provDef.ansi, `${provDef.icon} ${provDef.label}`)
            : theme.fg("dim", model?.provider || "—");
          const modelLabel = MODELS[model?.id?.toLowerCase() ?? ""] ?? model?.id ?? "—";
          const modelSeg   = theme.fg("accent", modelLabel);
          const thinking   = pi.getThinkingLevel();
          const thinkKey   = `thinking${thinking.charAt(0).toUpperCase()}${thinking.slice(1)}` as
            "thinkingOff"|"thinkingMinimal"|"thinkingLow"|"thinkingMedium"|"thinkingHigh"|"thinkingXhigh";
          const thinkSeg   = theme.fg(thinkKey, `(${thinking})`);

          const branch     = footerData.getGitBranch() ?? "";
          const dirty      = gitDirty();
          const branchSeg  = dirty
            ? theme.fg("warning", `\uE0A0 ${branch}${dirty}`)
            : theme.fg("muted",   `\uE0A0 ${branch || "no-git"}`);
          const turnSeg    = turnCount > 0 ? theme.fg("dim", `${turnCount}t`) : "";
          const r1L = [provSeg, modelSeg, thinkSeg].join(sep);
          const r1R = [
            theme.fg("text", `\uF07B ${basename(ctx.cwd ?? "") || "root"}`),
            branchSeg,
            ...(turnSeg ? [turnSeg] : []),
            theme.fg("dim", fmtElapsed(Date.now() - sessionStartAt)),
          ].join(sep) + " ";

          // row 2 — metrics
          cachedTotals ??= sumTotals(ctx);
          cachedUsage  ??= ctx.getContextUsage();
          const t     = cachedTotals;
          const usage = cachedUsage;
          const pct   = usage?.percent ?? null;
          const pctColor: "success"|"warning"|"error" =
            pct === null || pct < 60 ? "success" : pct < 80 ? "warning" : "error";

          const idleMs  = !agentRunning && lastActivityAt > 0 ? Date.now() - lastActivityAt : -1;
          const idleCol: "success"|"warning"|"error"|"dim" =
            idleMs < 180_000 ? "success" : idleMs < 270_000 ? "warning" : idleMs < 300_000 ? "error" : "dim";

          const r2L = [
            theme.fg("dim", `↑${fmt(t.input)}`),
            theme.fg("dim", `↓${fmt(t.output)}`),
            theme.fg("dim", `⊕${fmt(t.cacheRead)}`),
            theme.fg("dim", `⊗${fmt(t.cacheWrite)}`),
            theme.fg("dim", t.cost < 0.01 ? `$${t.cost.toFixed(4)}` : `$${t.cost.toFixed(3)}`),
            theme.fg(pctColor, pct !== null ? `${Math.round(pct)}%` : "?%") + " " +
              theme.fg("dim", `(${usage?.tokens != null ? fmt(usage.tokens) : "?"}/${usage ? fmt(usage.contextWindow) : "?"})`),
            ...(idleMs >= 0 ? [theme.fg(idleCol, `idle ${fmtElapsed(idleMs)}`)] : []),
          ].join(sep);
          const r2R = toolCounts.size > 0
            ? [...toolCounts.entries()].map(([n, c]) => theme.fg("dim", `${n} ${c}`)).join(theme.fg("dim", " │ ")) + " "
            : "";

          return [
            twoSides(r1L, r1R, width),
            r2R ? twoSides(r2L, r2R, width) : truncateToWidth(r2L, width),
            "",
          ];
        },
      };
    });
  });
}
