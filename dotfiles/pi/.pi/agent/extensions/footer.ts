import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { execSync } from "node:child_process";
import { basename } from "node:path";

const R = "\x1b[0m";
const c = (code: string, text: string) => `${code}${text}${R}`;

const FMT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const fmt = (n: number) => FMT.format(n);

function fmtIdle(ms: number): string {
  const s = Math.floor(ms / 1000),
    m = Math.floor(s / 60),
    h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function buildLine(left: string, right: string): string {
  if (!right) return left;
  const pad = Math.max(
    1,
    (process.stdout.columns ?? 80) -
      4 -
      stripAnsi(left).length -
      stripAnsi(right).length,
  );
  return left + " ".repeat(pad) + right;
}

const PROVIDERS: Record<string, { name: string; icon: string; color: string }> =
  {
    anthropic: { name: "Anthropic", icon: "󰚩", color: "\x1b[38;5;208m" },
    "openai-codex": { name: "OpenAI", icon: "󰚩", color: "\x1b[38;5;142m" },
    google: { name: "Google", icon: "󰊭", color: "\x1b[38;5;109m" },
    "github-copilot": { name: "Copilot", icon: "󰊤", color: "\x1b[38;5;175m" },
  };

const MODELS: Record<string, string> = {
  "claude-opus-4-6": "Opus 4.6",
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-haiku-4-5": "Haiku 4.5",
  "gpt-5.5": "GPT 5.5",
  "gemini-3.1-flash-lite-preview": "Gemini 3.1 FL",
};

function gitCache(
  cmd: string,
  ttl: number,
  fallback: string,
  tx: (s: string) => string,
) {
  let v = fallback,
    t = 0;
  return () => {
    const now = Date.now();
    if (now - t < ttl) return v;
    t = now;
    try {
      v = tx(execSync(cmd, { encoding: "utf8" }).trim());
    } catch {
      v = fallback;
    }
    return v;
  };
}
const gitBranch = gitCache(
  "git rev-parse --abbrev-ref HEAD",
  3_000,
  "",
  (s) => s,
);
const gitDirty = gitCache("git status --porcelain", 1_500, "", (s) =>
  s ? "*" : "",
);

interface Totals {
  input: number;
  output: number;
  cost: number;
}

function sumTotals(ctx: ExtensionContext): Totals {
  const t: Totals = { input: 0, output: 0, cost: 0 };
  for (const e of ctx.sessionManager.getBranch())
    if (e.type === "message" && e.message.role === "assistant") {
      const u = (e.message as AssistantMessage).usage;
      t.input += u.input;
      t.output += u.output;
      t.cost += u.cost.total ?? 0;
    }
  return t;
}

export default function (pi: ExtensionAPI) {
  const toolCounts = new Map<string, number>();
  let cachedTotals: Totals | undefined;
  let cachedUsage: ReturnType<ExtensionContext["getContextUsage"]>;
  let lastKey = "";
  let lastActivityAt = 0,
    agentRunning = false;
  let idleTimer: ReturnType<typeof setInterval> | undefined;
  let savedCtx: ExtensionContext | undefined;

  function update(): void {
    if (!savedCtx) return;
    const ctx = savedCtx;

    const model = ctx.model;
    const prov = PROVIDERS[model?.provider ?? ""];
    const sep = c("\x1b[38;5;240m", " | ");
    const topLeft = [
      prov ? c(prov.color, `${prov.icon} ${prov.name}`) : "",
      c(
        "\x1b[38;5;117m",
        MODELS[model?.id?.toLowerCase() ?? ""] ?? model?.id ?? "—",
      ),
      c("\x1b[38;5;246m", `(${pi.getThinkingLevel()})`),
    ]
      .filter(Boolean)
      .join(sep);

    const branch = gitBranch(),
      dirty = gitDirty();
    const topRight = [
      c("\x1b[38;5;179m", `\uF07B ${basename(ctx.cwd ?? "") || "root"}`),
      c(
        dirty ? "\x1b[38;5;214m" : "\x1b[38;5;246m",
        `\uE0A0 ${branch || "no-git"}${dirty}`,
      ),
    ].join(sep);

    // bottom: $cost  45% (50K/200K)  idle 2m        Bash 3 │ Read 5
    cachedTotals ??= sumTotals(ctx);
    cachedUsage ??= ctx.getContextUsage();
    const t = cachedTotals;
    const pct = cachedUsage?.percent ?? null;
    const pctColor =
      pct === null || pct < 60
        ? "\x1b[38;5;142m"
        : pct < 80
          ? "\x1b[38;5;214m"
          : "\x1b[38;5;196m";

    const idleMs = !agentRunning ? Date.now() - lastActivityAt : -1;
    const idleColor =
      idleMs < 0
        ? ""
        : idleMs < 180_000
          ? "\x1b[38;5;142m"
          : idleMs < 270_000
            ? "\x1b[38;5;214m"
            : idleMs < 300_000
              ? "\x1b[38;5;196m"
              : "\x1b[38;5;240m";

    const div = c("\x1b[38;5;240m", " | ");
    const bottomLeft = [
      c("\x1b[38;5;246m", `↑${fmt(t.input)}`),
      c("\x1b[38;5;246m", `↓${fmt(t.output)}`),
      c(
        "\x1b[38;5;246m",
        t.cost < 0.01 ? `$${t.cost.toFixed(4)}` : `$${t.cost.toFixed(3)}`,
      ),
      pct !== null
        ? c(pctColor, `${Math.round(pct)}%`) +
          c(
            "\x1b[38;5;240m",
            ` (${cachedUsage?.tokens != null ? fmt(cachedUsage.tokens) : "?"}/${cachedUsage ? fmt(cachedUsage.contextWindow) : "?"})`,
          )
        : "",
      idleMs >= 0 ? c(idleColor, `idle ${fmtIdle(idleMs)}`) : "",
    ]
      .filter(Boolean)
      .join(div);

    const bottomRight =
      toolCounts.size > 0
        ? [...toolCounts.entries()]
            .map(([n, cnt]) => c("\x1b[38;5;246m", `${n} ${cnt}`))
            .join(c("\x1b[38;5;240m", " | "))
        : "";

    const key = topLeft + topRight + bottomLeft + bottomRight;
    if (key === lastKey) return;
    lastKey = key;

    ctx.ui.setWidget("status-top", [buildLine(topLeft, topRight)], {
      placement: "aboveEditor",
    });
    ctx.ui.setWidget(
      "status-bottom",
      [buildLine(bottomLeft, bottomRight), " "],
      { placement: "belowEditor" },
    );
  }

  pi.on("agent_start", () => {
    agentRunning = true;
  });
  pi.on("agent_end", () => {
    agentRunning = false;
    lastActivityAt = Date.now();
    update();
  });
  pi.on("turn_end", () => {
    cachedTotals = cachedUsage = undefined;
    update();
  });
  pi.on("model_select", () => update());
  pi.on("thinking_level_select", () => update());
  pi.on("tool_execution_start", (event) => {
    toolCounts.set(event.toolName, (toolCounts.get(event.toolName) ?? 0) + 1);
    update();
  });
  pi.on("session_shutdown", () => {
    clearInterval(idleTimer);
    idleTimer = undefined;
  });

  pi.on("session_start", (_event, ctx) => {
    savedCtx = ctx;
    toolCounts.clear();
    cachedTotals = cachedUsage = undefined;
    lastActivityAt = Date.now();
    agentRunning = false;
    lastKey = "";

    clearInterval(idleTimer);
    idleTimer = setInterval(() => {
      if (!agentRunning) update();
    }, 30_000);

    ctx.ui.setFooter(() => ({ render: () => [], invalidate() {} }));
    update();
  });
}
