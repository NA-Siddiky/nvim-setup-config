/**
 * html.ts — gruvbox redesign with period toggle, theme toggle, and social share card.
 * Data is injected as window.__STATS_DATA__; React app reads it at runtime.
 */

import type {
  DailyStat,
  DurationBucket,
  ModelEfficiency,
  ModelStat,
  OverallStats,
  ProjectStat,
  RecentSession,
  TokenWasteEntry,
  ToolStat,
  WeeklyStat,
} from "./db.js";
import { fmtMs, fmtDate } from "./format.js";
import { GRUVBOX_CSS } from "./themes/gruvbox.css.js";

export interface ReportData {
  generatedAt: string;
  today: WeeklyStat;
  week: WeeklyStat;
  overall: OverallStats;
  tools: ToolStat[];
  models: ModelStat[];
  efficiency: ModelEfficiency[];
  projects: ProjectStat[];
  daily: DailyStat[];
  recent: RecentSession[];
  histogram: DurationBucket[];
  waste: TokenWasteEntry[];
  streak: number;
  toolless: { total: number; toolless: number };
}

export function buildHtml(d: ReportData): string {
  const chatOnlyPct =
    d.toolless.total > 0
      ? Math.round((d.toolless.toolless / d.toolless.total) * 100)
      : 0;

  const injected = JSON.stringify({
    today: {
      inputs: d.today.inputs,
      sessions: d.today.sessions,
      tokens: d.today.tokens,
      cost: d.today.cost,
      activeMs: d.today.timeMs,
      streakDays: d.streak,
      chatOnlyPct,
    },
    week: {
      inputs: d.week.inputs,
      sessions: d.week.sessions,
      tokens: d.week.tokens,
      cost: d.week.cost,
      activeMs: d.week.timeMs,
      streakDays: d.streak,
      chatOnlyPct,
    },
    overall: {
      sessions: d.overall.totalSessions,
      inputs: d.overall.totalInputs,
      turns: d.overall.totalTurns,
      tokens: d.overall.totalTokens,
      cost: d.overall.totalCost,
    },
    tools: d.tools.map((t) => ({ name: t.tool, uses: t.total })),
    models: d.efficiency.map((e) => ({
      provider: e.provider,
      model: e.model_id,
      inputs: e.inputs,
      avgTok: e.avgTokens,
      avgTime: e.avgTimeSec,
      costIn: e.costPerInput,
      total: e.totalCost,
    })),
    projects: d.projects.map((p) => ({ name: p.project, inputs: p.inputs })),
    response: d.histogram.map((b) => ({ b: b.label, n: b.count })),
    daily: d.daily.map((day) => [day.day, day.tokens] as [string, number]),
    recent: d.recent.map((s) => ({
      date: fmtDate(s.started_at),
      project: s.cwd?.split("/").pop() ?? "—",
      inputs: s.inputs ?? 0,
      turns: s.turns,
      tokens: s.tokens,
      cost: s.cost,
      dur: fmtMs(s.duration ?? 0),
    })),
    highToken: d.waste.map((w) => ({
      date: fmtDate(w.started_at),
      provider: w.provider,
      model: w.model_id,
      tokens: w.tokens_used,
      time: fmtMs(w.time_ms),
    })),
    generatedAt: d.generatedAt,
  });

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>π stats</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>${GRUVBOX_CSS}</style>
</head>
<body>
<div id="root"></div>
<script>window.__STATS_DATA__ = ${injected};</script>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
<script src="https://unpkg.com/html-to-image@1.11.13/dist/html-to-image.js"></script>
<script type="text/babel">
/* π stats — gruvbox redesign */
const { useState, useRef, useEffect } = React;
const D = window.__STATS_DATA__;

/* ---------- HELPERS ---------- */
const fmtNum = n => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\\.0$/, "") + "k";
  return String(n);
};
const fmt$ = n => "$" + n.toFixed(2);
const fmtTime = ms => {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  if (h) return h + "h " + m + "m";
  if (m) return m + "m " + ss + "s";
  return ss + "s";
};

/* ---------- COMPONENTS ---------- */
function Brand({ small }) {
  return (
    <div className={"brand " + (small ? "brand-sm" : "")}>
      <span className="pi">π</span>
      <span className="brand-name">stats</span>
    </div>
  );
}

function SegToggle({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.v} className={"seg-btn " + (value === o.v ? "on" : "")} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function IconBtn({ children, onClick, title, accent }) {
  return (
    <button className={"icon-btn " + (accent ? "accent" : "")} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

function Hero({ period, data }) {
  const stats = [
    { label: "inputs",   value: fmtNum(data.inputs),    hi: false, accent: false },
    { label: "sessions", value: String(data.sessions),  hi: false, accent: false },
    { label: "tokens",   value: fmtNum(data.tokens),    hi: false, accent: false },
    { label: "cost",     value: fmt$(data.cost),         hi: true,  accent: false },
    { label: "active",   value: fmtTime(data.activeMs), hi: false, accent: false },
    { label: "streak",   value: data.streakDays + "d",  hi: false, accent: true  },
  ];
  return (
    <section className="hero">
      <div className="hero-head">
        <div className="eyebrow">{period === "today" ? "today's usage" : "this week"}</div>
        <div className="hero-date">
          {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>
      <div className="hero-grid">
        {stats.map(s => (
          <div key={s.label} className={"stat " + (s.hi ? "stat-hi " : "") + (s.accent ? "stat-accent " : "")}>
            <div className="stat-val">{s.value}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BarList({ rows, max, accent = "yellow" }) {
  return (
    <ul className="bar-list">
      {rows.map(r => {
        const pct = Math.max(2, (r.value / max) * 100);
        return (
          <li key={r.label} className="bar-row">
            <div className="bar-label">{r.label}</div>
            <div className="bar-track">
              <div className={"bar-fill bar-" + accent} style={{ width: pct + "%" }} />
            </div>
            <div className="bar-value">{r.value}</div>
          </li>
        );
      })}
    </ul>
  );
}

function Card({ title, hint, children, span, scroll }) {
  return (
    <section className="card" style={{ gridColumn: span ? "span " + span : undefined }}>
      <header className="card-head">
        <h3>{title}</h3>
        {hint && <span className="card-hint">{hint}</span>}
      </header>
      <div className={"card-body " + (scroll ? "scroll" : "")}>{children}</div>
    </section>
  );
}

function DailyChart({ data }) {
  const max = Math.max(...data.map(d => d[1]));
  return (
    <div className="daily-chart">
      {data.map(([d, v], i) => {
        const h = Math.max(3, (v / max) * 100);
        const isToday = i === data.length - 1;
        return (
          <div className="dc-col" key={d} title={d + ": " + fmtNum(v) + " tokens"}>
            <div className={"dc-bar " + (isToday ? "today" : "")} style={{ height: h + "%" }} />
          </div>
        );
      })}
    </div>
  );
}

function last7Days() {
  const tail = D.daily.slice(-7);
  return tail.map(([dateStr, tokens], i) => {
    const dt = new Date(dateStr);
    const dow = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dt.getDay()];
    return { date: dateStr, dow, tokens, isToday: i === tail.length - 1 };
  });
}

function ShareCard({ period, data, theme }) {
  const topModel = D.models[0] || { model: "—", inputs: 0, total: 0 };
  const date = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  const days = last7Days();
  const maxDay = Math.max(...days.map(d => d.tokens), 1);
  const tier = v => {
    if (v >= 1_500_000) return "peak";
    if (v >= 700_000)   return "high";
    if (v >= 200_000)   return "mid";
    return "low";
  };
  const modelName = topModel.model.replace(/^claude-/, "claude ").replace(/-([0-9])/, " $1");
  const title = period === "today" ? "Today's Usage" : "Weekly Usage";

  return (
    <div className={"share-card share-" + theme}>
      <div className="sc-glow" />
      <div className="sc-panel">
        <div className="sc-brand">
          <div className="sc-brand-mark">π</div>
          <div className="sc-brand-name">AI Stats</div>
        </div>
        <h1 className="sc-title">{title}</h1>
        <div className="sc-rule" />
        <div className="sc-pair">
          <div className="sc-pair-col">
            <div className="sc-pair-lbl">Total Tokens</div>
            <div className="sc-pair-val sc-yellow">{fmtNum(data.tokens)}</div>
            <div className="sc-pair-sub">{period === "today" ? "today" : "this week"}</div>
          </div>
          <div className="sc-pair-col">
            <div className="sc-pair-lbl">
              <span>Top Model</span>
              <svg className="sc-chip" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>
            </div>
            <div className="sc-pair-val sc-orange">{modelName}</div>
            <div className="sc-pair-sub">{topModel.inputs} inputs · {fmt$(topModel.total)}</div>
          </div>
        </div>
        <div className="sc-pills">
          <div className="sc-pill">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            <span className="sc-pill-lbl">Inputs:</span>
            <span className="sc-pill-val">{data.inputs}</span>
          </div>
          <div className="sc-pill">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <span className="sc-pill-lbl">Cost:</span>
            <span className="sc-pill-val">{fmt$(data.cost)}</span>
          </div>
        </div>
        <div className="sc-chart-h">Weekly Activity</div>
        <div className="sc-chart">
          {days.map(d => {
            const h = Math.max(8, (d.tokens / maxDay) * 100);
            return (
              <div className="sc-bar-col" key={d.date}>
                <div className="sc-bar-val">{fmtNum(d.tokens)}</div>
                <div className={"sc-bar sc-bar-" + tier(d.tokens) + (d.isToday ? " sc-bar-today" : "")} style={{ height: h + "%" }} />
                <div className="sc-bar-dow">{d.dow}</div>
              </div>
            );
          })}
        </div>
        <div className="sc-foot">
          <div className="sc-foot-l">{date}</div>
          <div className="sc-foot-r">π stats · {data.streakDays}d streak</div>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ open, onClose, period, data, theme }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const download = async () => {
    setBusy(true);
    try {
      const node = cardRef.current.querySelector(".share-card");
      const dataUrl = await window.htmlToImage.toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: theme === "light" ? "#fbf1c7" : "#1d2021",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "pi-stats-" + period + "-" + new Date().toISOString().slice(0, 10) + ".png";
      a.click();
    } catch (e) {
      alert("Couldn't generate image: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h2>share summary</h2>
            <p>1080 × 1080 · ready for socials</p>
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={onClose}>close</button>
            <button className="btn primary" onClick={download} disabled={busy}>
              {busy ? "rendering…" : "download .png"}
            </button>
          </div>
        </header>
        <div className="modal-body" ref={cardRef}>
          <div className="share-wrap">
            <ShareCard period={period} data={data} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- APP ---------- */
function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("pi.theme") || "dark");
  const [period, setPeriod] = useState(() => localStorage.getItem("pi.period") || "today");
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pi.theme", theme);
  }, [theme]);
  useEffect(() => { localStorage.setItem("pi.period", period); }, [period]);

  const data = period === "today" ? D.today : D.week;
  const toolMax  = Math.max(...D.tools.map(t => t.uses), 1);
  const projMax  = Math.max(...D.projects.map(p => p.inputs), 1);
  const respMax  = Math.max(...D.response.map(r => r.n), 1);

  return (
    <div className="page">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="topbar-l">
          <Brand />
          <span className="dot">·</span>
          <span className="muted">ai usage</span>
        </div>
        <div className="topbar-r">
          <SegToggle
            value={period}
            onChange={setPeriod}
            options={[{ v: "today", label: "today" }, { v: "week", label: "week" }]}
          />
          <IconBtn onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="toggle theme">
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
            <span className="icon-btn-lbl">{theme}</span>
          </IconBtn>
          <IconBtn onClick={() => setShareOpen(true)} title="share" accent>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            <span className="icon-btn-lbl">share</span>
          </IconBtn>
        </div>
      </header>

      {/* HERO */}
      <Hero period={period} data={data} />

      {/* MAIN GRID */}
      <main className="grid">
        <Card title="tools" hint="7 days" span={4}>
          <BarList accent="yellow" max={toolMax} rows={D.tools.map(t => ({ label: t.name, value: t.uses }))} />
        </Card>

        <Card title="response times" hint="7 days" span={4}>
          <BarList accent="aqua" max={respMax} rows={D.response.map(r => ({ label: r.b, value: r.n }))} />
        </Card>

        <Card title="projects" hint="all-time" span={4} scroll>
          <BarList accent="orange" max={projMax} rows={D.projects.map(p => ({ label: p.name, value: p.inputs }))} />
        </Card>

        {D.daily.length > 0 && (
          <Card title="daily token usage" hint={"last " + D.daily.length + " days"} span={12}>
            <div className="daily-wrap">
              <DailyChart data={D.daily} />
              <div className="daily-axis">
                <span>{D.daily[0][0]}</span>
                <span className="muted">peak {fmtNum(Math.max(...D.daily.map(d => d[1])))}</span>
                <span>{D.daily[D.daily.length - 1][0]}</span>
              </div>
            </div>
          </Card>
        )}

        {D.models.length > 0 && (
          <Card title="models" hint="ranked by inputs" span={12}>
            <div className="t-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>provider</th><th>model</th>
                    <th className="r">inputs</th>
                    <th className="r">avg tok</th>
                    <th className="r">avg time</th>
                    <th className="r">$/inp</th>
                    <th className="r">total</th>
                  </tr>
                </thead>
                <tbody>
                  {D.models.map((m, i) => (
                    <tr key={i}>
                      <td className="muted">{m.provider}</td>
                      <td>{m.model}</td>
                      <td className="r">{m.inputs}</td>
                      <td className="r">{fmtNum(m.avgTok)}</td>
                      <td className="r">{m.avgTime.toFixed(1)}s</td>
                      <td className="r">{m.costIn < 0.01 && m.costIn > 0 ? "<$0.01" : fmt$(m.costIn)}</td>
                      <td className="r cost">{fmt$(m.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {D.recent.length > 0 && (
          <Card title="recent sessions" span={7}>
            <div className="t-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>date</th><th>project</th><th className="r">turns</th><th className="r">tokens</th><th className="r">cost</th><th className="r">dur</th></tr>
                </thead>
                <tbody>
                  {D.recent.map((r, i) => (
                    <tr key={i}>
                      <td className="muted">{r.date}</td>
                      <td>{r.project}</td>
                      <td className="r">{r.turns}</td>
                      <td className="r">{fmtNum(r.tokens)}</td>
                      <td className="r cost">{fmt$(r.cost)}</td>
                      <td className="r muted">{r.dur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {D.highToken.length > 0 && (
          <Card title="high-token no-tool inputs" span={D.recent.length > 0 ? 5 : 12}>
            <div className="t-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>date</th><th>model</th><th className="r">tokens</th><th className="r">time</th></tr>
                </thead>
                <tbody>
                  {D.highToken.map((h, i) => (
                    <tr key={i}>
                      <td className="muted">{h.date}</td>
                      <td>{h.model}</td>
                      <td className="r warn">{fmtNum(h.tokens)}</td>
                      <td className="r muted">{h.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {/* ALL-TIME FOOTER */}
      <footer className="footer">
        <div className="footer-l">
          <div className="eyebrow">all-time</div>
          <div className="footer-stats">
            <div className="fs"><span className="v">{D.overall.sessions}</span><span className="l">sessions</span></div>
            <div className="fs"><span className="v">{D.overall.inputs}</span><span className="l">inputs</span></div>
            <div className="fs"><span className="v">{D.overall.turns}</span><span className="l">turns</span></div>
            <div className="fs"><span className="v">{fmtNum(D.overall.tokens)}</span><span className="l">tokens</span></div>
            <div className="fs"><span className="v cost">{fmt$(D.overall.cost)}</span><span className="l">cost</span></div>
          </div>
        </div>
        <div className="footer-r">
          <Brand small />
          <span className="dot">·</span>
          <span className="muted">{D.generatedAt}</span>
        </div>
      </footer>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} period={period} data={data} theme={theme} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
</script>
</body>
</html>`;
}
