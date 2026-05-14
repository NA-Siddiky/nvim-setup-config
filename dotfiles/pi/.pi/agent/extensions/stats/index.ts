/**
 * stats/index.ts — Pi usage stats extension
 *
 * Stores the richest possible data per session and per user prompt:
 *
 *   session_start      → open/create session row
 *   model_select       → record model switches
 *   before_agent_start → open input row; capture branch + prompt prefix
 *   message_end        → accumulate all token/cost fields per LLM turn
 *   tool_execution_start → count tools per input and session
 *   turn_end           → bump turn counter; sync context token count
 *   agent_end          → close input row with final timing/costs
 *   input              → track slash commands and skill invocations
 *   session_shutdown   → close session row; close DB
 *
 * /stat  → renders a TUI overview, press Enter to open the full HTML dashboard
 *
 * Uses node:sqlite (built-in Node 22.5+). No npm install needed.
 */

import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { spawn } from "node:child_process";

import {
  closeDb,
  createInputRecord,
  finalizeInputRecord,
  finalizeSession,
  getDailyStats,
  getDurationHistogram,
  getModelEfficiency,
  getOverallStats,
  getRecentSessions,
  getStreak,
  getTodayStats,
  getTokenWaste,
  getToollessInputCount,
  getTopModelsByInputs,
  getTopProjects,
  getTopToolsByInputs,
  getWeeklyStats,
  upsertSession,
} from "./db.js";
import { buildHtml } from "./html.js";

const STATS_CONFIG = {
  weekDays: 7,
  topToolsLimit: 10,
  topModelsLimit: 6,
  topProjectsLimit: 8,
  tokenGraphDays: 30,
  recentSessionsLimit: 6,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionState {
  id: string;
  startedAt: number;
  turns: number;
  tokens: number;
  tools: Map<string, number>;
  commands: Map<string, number>;
  skills: Map<string, number>;
  models: Array<{ provider: string; modelId: string; selectedAt: number }>;
}

interface InputState {
  id: string;
  sessionId: string;
  startedAt: number;
  provider: string;
  modelId: string;
  branch: string;
  tools: Map<string, number>;
  commands: Map<string, number>;
  skills: Map<string, number>;
  /** Context-window tokens from the last assistant turn (totalTokens) */
  totalTokens: number;
  /** All split token counts accumulated across every assistant turn */
  tokensInput: number;
  tokensOutput: number;
  tokensCacheRead: number;
  tokensCacheWrite: number;
  /** Sum of cost.total across every assistant turn (cache-inclusive) */
  costAccumulated: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inc(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function weekRange(): { start: number; end: number } {
  const end = Date.now();
  return { start: end - STATS_CONFIG.weekDays * 86_400_000, end };
}

function parseInputPrefix(text: string): {
  skills: Map<string, number>;
  commands: Map<string, number>;
} {
  const skills = new Map<string, number>();
  const commands = new Map<string, number>();
  const trimmed = text.trim();
  if (trimmed.startsWith("/skill:")) {
    const name = trimmed.slice(7).split(" ")[0] ?? "";
    if (name) inc(skills, name);
  } else if (trimmed.startsWith("/")) {
    const name = trimmed.slice(1).split(" ")[0] ?? "";
    if (name) inc(commands, name);
  }
  return { skills, commands };
}

let _gitBranchAt = 0,
  _gitBranchVal = "";
function gitBranch(): string {
  const now = Date.now();
  if (now - _gitBranchAt < 5_000) return _gitBranchVal;
  _gitBranchAt = now;
  try {
    _gitBranchVal = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    _gitBranchVal = "";
  }
  return _gitBranchVal;
}

/**
 * Resolve session ID: use the stable UUID v7 from SessionManager.getSessionId()
 * (exists at runtime but not in the public TS types), falling back to a derivation
 * from the session file path.
 */
function resolveSessionId(ctx: ExtensionContext): string {
  const sm = ctx.sessionManager as unknown as { getSessionId?(): string };
  if (typeof sm.getSessionId === "function") return sm.getSessionId();
  const file = ctx.sessionManager.getSessionFile();
  return file ? basename(file, ".jsonl") : `ephemeral_${Date.now()}`;
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI): void {
  let session: SessionState | null = null;
  let currentInput: InputState | null = null;

  // ── Session lifecycle ─────────────────────────────────────────────────────

  pi.on("session_start", (_, ctx: ExtensionContext) => {
    const id = resolveSessionId(ctx);
    const now = Date.now();
    session = {
      id,
      startedAt: now,
      turns: 0,
      tokens: 0,
      tools: new Map(),
      commands: new Map(),
      skills: new Map(),
      models: ctx.model
        ? [
            {
              provider: ctx.model.provider,
              modelId: ctx.model.id,
              selectedAt: now,
            },
          ]
        : [],
    };
    upsertSession(id, now, ctx.cwd ?? "");
  });

  pi.on("model_select", (event) => {
    session?.models.push({
      provider: event.model.provider,
      modelId: event.model.id,
      selectedAt: Date.now(),
    });
  });

  // ── Per-input lifecycle ───────────────────────────────────────────────────

  pi.on("before_agent_start", (event, ctx: ExtensionContext) => {
    if (!session) return;
    currentInput = null;

    const { skills, commands } = parseInputPrefix(event.prompt ?? "");
    const model = ctx.model;

    currentInput = {
      id: randomUUID(),
      sessionId: session.id,
      startedAt: Date.now(),
      provider: model?.provider ?? "unknown",
      modelId: model?.id ?? "unknown",
      branch: gitBranch(),
      tools: new Map(),
      commands,
      skills,
      totalTokens: 0,
      tokensInput: 0,
      tokensOutput: 0,
      tokensCacheRead: 0,
      tokensCacheWrite: 0,
      costAccumulated: 0,
    };

    createInputRecord({
      id: currentInput.id,
      sessionId: currentInput.sessionId,
      startedAt: currentInput.startedAt,
      provider: currentInput.provider,
      modelId: currentInput.modelId,
      branch: currentInput.branch,
    });
  });

  pi.on("message_end", (event) => {
    if (event.message.role !== "assistant" || !currentInput) return;
    const msg = event.message as AssistantMessage;
    if (!msg.usage) return;

    // totalTokens = last turn's context-window size (overwrite, don't accumulate)
    currentInput.totalTokens = msg.usage.totalTokens ?? 0;
    // All cost/token fields: accumulate across every assistant turn in this input
    currentInput.costAccumulated += msg.usage.cost.total ?? 0;
    currentInput.tokensInput += msg.usage.input ?? 0;
    currentInput.tokensOutput += msg.usage.output ?? 0;
    currentInput.tokensCacheRead += msg.usage.cacheRead ?? 0;
    currentInput.tokensCacheWrite += msg.usage.cacheWrite ?? 0;
  });

  pi.on("tool_execution_start", (event) => {
    if (session) inc(session.tools, event.toolName);
    if (currentInput) inc(currentInput.tools, event.toolName);
  });

  pi.on("turn_end", (_, ctx: ExtensionContext) => {
    if (!session) return;
    session.turns++;
    const usage = ctx.getContextUsage();
    if (usage?.tokens) session.tokens = usage.tokens;
  });

  pi.on("agent_end", () => {
    if (!currentInput || !session) return;
    const endedAt = Date.now();

    try {
      finalizeInputRecord(
        currentInput.id,
        endedAt,
        endedAt - currentInput.startedAt,
        currentInput.totalTokens,
        currentInput.tools,
        currentInput.commands,
        currentInput.skills,
        currentInput.costAccumulated,
        currentInput.tokensInput,
        currentInput.tokensOutput,
        currentInput.tokensCacheRead,
        currentInput.tokensCacheWrite,
      );
    } catch (e) {
      console.error("[pi-stats] finalizeInputRecord failed:", e);
    }
    currentInput = null;
  });

  // ── Command + skill tracking (session-level) ──────────────────────────────

  pi.on("input", (event) => {
    if (!session) return;
    const text = event.text.trim();
    if (text.startsWith("/skill:")) {
      inc(session.skills, text.slice(7).split(" ")[0] ?? "");
    } else if (text.startsWith("/")) {
      inc(session.commands, text.slice(1).split(" ")[0] ?? "");
    }
  });

  // ── Session shutdown ──────────────────────────────────────────────────────

  pi.on("session_shutdown", () => {
    if (!session) return;
    currentInput = null;

    try {
      finalizeSession(
        session.id,
        Date.now(),
        session.turns,
        session.tokens,
        session.tools,
        session.commands,
        session.skills,
        session.models,
      );
    } catch (e) {
      console.error("[pi-stats] finalizeSession failed:", e);
    }
    session = null;
    closeDb();
  });

  // ── /stat command ─────────────────────────────────────────────────────────

  pi.registerCommand("stat", {
    description: "Show usage stats dashboard (Enter to open in browser)",
    handler: async (_, ctx: ExtensionContext) => {
      const { start, end } = weekRange();

      const data = {
        overall: getOverallStats(),
        weekly: getWeeklyStats(start, end),
        today: getTodayStats(),
        tools: getTopToolsByInputs(start, STATS_CONFIG.topToolsLimit),
        models: getTopModelsByInputs(STATS_CONFIG.topModelsLimit),
        efficiency: getModelEfficiency(),
        projects: getTopProjects(STATS_CONFIG.topProjectsLimit),
        daily: getDailyStats(STATS_CONFIG.tokenGraphDays),
        recent: getRecentSessions(STATS_CONFIG.recentSessionsLimit),
        toolless: getToollessInputCount(start),
        streak: getStreak(),
        histogram: getDurationHistogram(),
        waste: getTokenWaste(),
        start,
        end,
      };

      const html = buildHtml({
        generatedAt: new Date().toLocaleString(),
        today: data.today,
        week: data.weekly,
        overall: data.overall,
        tools: data.tools,
        models: data.models,
        efficiency: data.efficiency,
        projects: data.projects,
        daily: data.daily,
        recent: data.recent,
        histogram: data.histogram,
        waste: data.waste,
        streak: data.streak,
        toolless: data.toolless,
      });

      const outPath = join(tmpdir(), "pi-stats.html");
      writeFileSync(outPath, html, "utf8");
      const opener = process.platform === "darwin" ? "open" : "xdg-open";
      spawn(opener, [outPath], { detached: true, stdio: "ignore" }).unref();
      ctx.ui.notify(`Stats opened  ${outPath}`, "success");
    },
  });
}
