/**
 * html.ts — self-contained HTML report
 * No external dependencies. Dark, monospace, every field visible.
 */

import type {
  DailyStat, DurationBucket, ModelEfficiency, ModelStat,
  OverallStats, ProjectStat, RecentSession, TokenWasteEntry,
  ToolStat, WeeklyStat,
} from "./db.js";
import { fmtTokens, fmtCost, fmtMs, fmtDate, escHtml } from "./format.js";

export interface ReportData {
  generatedAt: string;
  today:       WeeklyStat;
  week:        WeeklyStat;
  overall:     OverallStats;
  tools:       ToolStat[];
  models:      ModelStat[];
  efficiency:  ModelEfficiency[];
  projects:    ProjectStat[];
  daily:       DailyStat[];
  recent:      RecentSession[];
  histogram:   DurationBucket[];
  waste:       TokenWasteEntry[];
  streak:      number;
  toolless:    { total: number; toolless: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bar(value: number, max: number): string {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return `<div style="width:${pct}%;height:3px;background:#d4a017;border-radius:2px;min-width:${pct > 0 ? 2 : 0}px"></div>`;
}

function th(...cols: string[]): string {
  return `<tr>${cols.map(c => `<th>${escHtml(c)}</th>`).join("")}</tr>`;
}

function spark(daily: DailyStat[]): string {
  if (daily.length < 2) return "<span style='color:#504945'>no data</span>";
  const max = Math.max(...daily.map(d => d.tokens), 1);
  const blocks = ["▁","▂","▃","▄","▅","▆","▇","█"];
  return daily.map(d => {
    const i = Math.min(7, Math.floor((d.tokens / max) * 8));
    const col = d.tokens > max * 0.7 ? "#d4a017" : d.tokens > max * 0.3 ? "#b8bb26" : "#928374";
    return `<span style="color:${col}" title="${d.day}: ${fmtTokens(d.tokens)}">${blocks[i]}</span>`;
  }).join("");
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#1d2021;color:#ebdbb2;font:13px/1.6 ui-monospace,"Cascadia Code","JetBrains Mono",monospace;padding:32px 40px}
a{color:#83a598}
h2{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#928374;margin:28px 0 10px}
h2:first-child{margin-top:0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:4px}
.box{background:#282828;border-radius:6px;padding:18px 20px}
.row{display:flex;gap:32px;flex-wrap:wrap}
.stat{min-width:100px}
.stat-val{font-size:24px;font-weight:700;color:#ebdbb2;line-height:1}
.stat-sub{font-size:11px;color:#928374;margin-top:3px}
table{width:100%;border-collapse:collapse;font-size:12px}
thead tr{border-bottom:1px solid #3c3836}
th{text-align:left;padding:6px 8px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#928374;font-weight:600}
td{padding:6px 8px;border-bottom:1px solid #282828;vertical-align:middle}
tr:last-child td{border-bottom:none}
.r{text-align:right}
.num{font-variant-numeric:tabular-nums}
.dim{color:#928374}
.acc{color:#d4a017}
.grn{color:#b8bb26}
.blu{color:#83a598}
.org{color:#fe8019}
.bar-cell{width:80px}
.meta{font-size:11px;color:#504945;margin-top:32px;padding-top:12px;border-top:1px solid #282828}
`;

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildHtml(d: ReportData): string {
  const maxTool = d.tools[0]?.total ?? 1;
  const maxProj = d.projects[0]?.inputs ?? 1;
  const maxHist = Math.max(...d.histogram.map(b => b.count), 1);
  const chatOnlyPct = d.toolless.total > 0
    ? Math.round((d.toolless.toolless / d.toolless.total) * 100)
    : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>π stats</title>
<style>${CSS}</style>
</head>
<body>

<h2 style="margin-top:0">Today</h2>
<div class="box" style="margin-bottom:16px">
  <div class="row">
    <div class="stat"><div class="stat-val">${d.today.inputs}</div><div class="stat-sub">inputs</div></div>
    <div class="stat"><div class="stat-val">${d.today.sessions}</div><div class="stat-sub">sessions</div></div>
    <div class="stat"><div class="stat-val">${fmtTokens(d.today.tokens)}</div><div class="stat-sub">tokens</div></div>
    <div class="stat"><div class="stat-val acc">${fmtCost(d.today.cost)}</div><div class="stat-sub">cost</div></div>
    <div class="stat"><div class="stat-val dim">${fmtMs(d.today.timeMs)}</div><div class="stat-sub">active time</div></div>
  </div>
</div>

<h2>This Week</h2>
<div class="box" style="margin-bottom:16px">
  <div class="row">
    <div class="stat"><div class="stat-val">${d.week.inputs}</div><div class="stat-sub">inputs</div></div>
    <div class="stat"><div class="stat-val">${d.week.sessions}</div><div class="stat-sub">sessions</div></div>
    <div class="stat"><div class="stat-val">${fmtTokens(d.week.tokens)}</div><div class="stat-sub">tokens</div></div>
    <div class="stat"><div class="stat-val acc">${fmtCost(d.week.cost)}</div><div class="stat-sub">cost</div></div>
    <div class="stat"><div class="stat-val dim">${fmtMs(d.week.timeMs)}</div><div class="stat-sub">active time</div></div>
    ${d.streak > 0 ? `<div class="stat"><div class="stat-val org">${d.streak}d</div><div class="stat-sub">streak</div></div>` : ""}
    <div class="stat"><div class="stat-val dim">${chatOnlyPct}%</div><div class="stat-sub">chat-only</div></div>
  </div>
</div>

<div class="grid2">

  <div>
    <h2>Tools (7 days)</h2>
    <div class="box">
      <table>
        <thead>${th("tool", "uses", "")}</thead>
        <tbody>
          ${d.tools.length ? d.tools.map(t => `<tr>
            <td>${escHtml(t.tool)}</td>
            <td class="r num blu">${t.total}</td>
            <td class="bar-cell">${bar(t.total, maxTool)}</td>
          </tr>`).join("") : `<tr><td colspan="3" class="dim">no data</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>

  <div>
    <h2>Models (7 days)</h2>
    <div class="box">
      <table>
        <thead>${th("provider", "model", "inputs", "cost", "tokens")}</thead>
        <tbody>
          ${d.models.length ? d.models.map(m => `<tr>
            <td class="dim">${escHtml(m.provider)}</td>
            <td>${escHtml(m.model_id)}</td>
            <td class="r num">${m.uses}</td>
            <td class="r num grn">—</td>
            <td class="r num dim">—</td>
          </tr>`).join("") : `<tr><td colspan="5" class="dim">no data</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>

</div>

<h2>Model Efficiency</h2>
<div class="box">
  <table>
    <thead>${th("provider", "model", "inputs", "avg tokens", "avg time", "$/input", "total cost")}</thead>
    <tbody>
      ${d.efficiency.length ? d.efficiency.map(e => `<tr>
        <td class="dim">${escHtml(e.provider)}</td>
        <td>${escHtml(e.model_id)}</td>
        <td class="r num">${e.inputs}</td>
        <td class="r num dim">${fmtTokens(e.avgTokens)}</td>
        <td class="r num dim">${e.avgTimeSec}s</td>
        <td class="r num dim">${fmtCost(e.costPerInput)}</td>
        <td class="r num grn">${fmtCost(e.totalCost)}</td>
      </tr>`).join("") : `<tr><td colspan="7" class="dim">no data</td></tr>`}
    </tbody>
  </table>
</div>

<div class="grid2" style="margin-top:4px">

  <div>
    <h2>Projects</h2>
    <div class="box">
      <table>
        <thead>${th("project", "inputs", "")}</thead>
        <tbody>
          ${d.projects.length ? d.projects.map(p => `<tr>
            <td>${escHtml(p.project)}</td>
            <td class="r num">${p.inputs}</td>
            <td class="bar-cell">${bar(p.inputs, maxProj)}</td>
          </tr>`).join("") : `<tr><td colspan="3" class="dim">no data</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>

  <div>
    <h2>Response Time Distribution</h2>
    <div class="box">
      <table>
        <thead>${th("bucket", "count", "")}</thead>
        <tbody>
          ${d.histogram.map(b => `<tr>
            <td class="dim">${escHtml(b.label)}</td>
            <td class="r num">${b.count}</td>
            <td class="bar-cell">${bar(b.count, maxHist)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>

</div>

<h2>Daily Token Usage (30 days)</h2>
<div class="box">
  <div style="margin-bottom:10px;font-size:18px;letter-spacing:1px">${spark(d.daily)}</div>
  <table>
    <thead>${th("date", "inputs", "sessions", "tokens")}</thead>
    <tbody>
      ${d.daily.length ? d.daily.slice().reverse().slice(0, 14).map(day => `<tr>
        <td class="dim">${escHtml(day.day)}</td>
        <td class="r num">${day.inputs}</td>
        <td class="r num dim">${day.sessions}</td>
        <td class="r num">${fmtTokens(day.tokens)}</td>
      </tr>`).join("") : `<tr><td colspan="4" class="dim">no data</td></tr>`}
    </tbody>
  </table>
</div>

<h2>Recent Sessions</h2>
<div class="box">
  <table>
    <thead>${th("date", "project", "inputs", "turns", "tokens", "cost", "duration")}</thead>
    <tbody>
      ${d.recent.length ? d.recent.map(s => `<tr>
        <td class="dim">${escHtml(fmtDate(s.started_at))}</td>
        <td>${escHtml(s.cwd?.split("/").pop() ?? "—")}</td>
        <td class="r num">${s.inputs ?? 0}</td>
        <td class="r num dim">${s.turns}</td>
        <td class="r num">${fmtTokens(s.tokens)}</td>
        <td class="r num grn">${fmtCost(s.cost)}</td>
        <td class="r num dim">${fmtMs(s.duration ?? 0)}</td>
      </tr>`).join("") : `<tr><td colspan="7" class="dim">no data</td></tr>`}
    </tbody>
  </table>
</div>

${d.waste.length ? `
<h2>High-Token No-Tool Inputs</h2>
<div class="box">
  <table>
    <thead>${th("date", "provider", "model", "tokens", "time")}</thead>
    <tbody>
      ${d.waste.map(w => `<tr>
        <td class="dim">${escHtml(fmtDate(w.started_at))}</td>
        <td class="dim">${escHtml(w.provider)}</td>
        <td>${escHtml(w.model_id)}</td>
        <td class="r num org">${fmtTokens(w.tokens_used)}</td>
        <td class="r num dim">${fmtMs(w.time_ms)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>` : ""}

<h2>All-time</h2>
<div class="box">
  <div class="row">
    <div class="stat"><div class="stat-val">${d.overall.totalSessions}</div><div class="stat-sub">sessions</div></div>
    <div class="stat"><div class="stat-val">${d.overall.totalInputs}</div><div class="stat-sub">inputs</div></div>
    <div class="stat"><div class="stat-val">${d.overall.totalTurns}</div><div class="stat-sub">turns</div></div>
    <div class="stat"><div class="stat-val">${fmtTokens(d.overall.totalTokens)}</div><div class="stat-sub">tokens</div></div>
    <div class="stat"><div class="stat-val acc">${fmtCost(d.overall.totalCost)}</div><div class="stat-sub">cost</div></div>
  </div>
</div>

<div class="meta">π stats · ${escHtml(d.generatedAt)}</div>
</body>
</html>`;
}
