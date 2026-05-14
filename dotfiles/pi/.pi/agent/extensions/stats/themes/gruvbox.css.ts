export const GRUVBOX_CSS = `
/* ===================== gruvbox tokens ===================== */
:root[data-theme="dark"] {
  --bg0: #1d2021;
  --bg1: #282828;
  --bg2: #32302f;
  --bg3: #3c3836;
  --bg4: #504945;
  --line: #3c3836;
  --line-soft: #2a2725;
  --fg0: #fbf1c7;
  --fg1: #ebdbb2;
  --fg2: #d5c4a1;
  --fg3: #bdae93;
  --mute: #928374;
  --yellow: #fabd2f;
  --yellow-d: #d79921;
  --orange: #fe8019;
  --orange-d: #d65d0e;
  --red: #fb4934;
  --green: #b8bb26;
  --aqua: #8ec07c;
  --blue: #83a598;
  --purple: #d3869b;
  --accent: var(--yellow);
  --cost: var(--yellow);
  --warn: var(--orange);
  --shadow: 0 1px 0 rgba(0,0,0,0.4), 0 0 0 1px var(--line);
}

:root[data-theme="light"] {
  --bg0: #fbf1c7;
  --bg1: #f9f5d7;
  --bg2: #f2e5bc;
  --bg3: #ebdbb2;
  --bg4: #d5c4a1;
  --line: #d5c4a1;
  --line-soft: #ebdbb2;
  --fg0: #282828;
  --fg1: #3c3836;
  --fg2: #504945;
  --fg3: #665c54;
  --mute: #7c6f64;
  --yellow: #b57614;
  --yellow-d: #af3a03;
  --orange: #af3a03;
  --orange-d: #d65d0e;
  --red: #9d0006;
  --green: #79740e;
  --aqua: #427b58;
  --blue: #076678;
  --purple: #8f3f71;
  --accent: var(--yellow);
  --cost: var(--yellow-d);
  --warn: var(--orange);
  --shadow: 0 1px 0 rgba(0,0,0,0.04), 0 0 0 1px var(--line);
}

/* ===================== base ===================== */
* { box-sizing: border-box; }
html, body { background: var(--bg0); color: var(--fg1); }
body {
  margin: 0;
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-feature-settings: "calt" 0;
  font-size: 13px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 28px 32px 80px;
}
.muted { color: var(--mute); }
.cost { color: var(--cost); }
.warn { color: var(--warn); }
.r { text-align: right; }
.dot { color: var(--mute); margin: 0 8px; }

/* ===================== brand / topbar ===================== */
.brand { display: inline-flex; align-items: baseline; gap: 8px; font-weight: 700; font-size: 18px; letter-spacing: -0.01em; }
.brand .pi { color: var(--accent); font-size: 22px; line-height: 1; }
.brand-name { color: var(--fg0); }
.brand-sm { font-size: 13px; gap: 6px; }
.brand-sm .pi { font-size: 15px; }
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  background: var(--bg1);
  border: 1px solid var(--line);
  border-radius: 8px;
  margin-bottom: 24px;
}
.topbar-l, .topbar-r { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; white-space: nowrap; }
.topbar-r { gap: 8px; }

.seg {
  display: inline-flex;
  background: var(--bg0);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 3px;
  gap: 2px;
}
.seg-btn {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--mute);
  font: inherit;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  letter-spacing: 0.02em;
}
.seg-btn:hover { color: var(--fg1); }
.seg-btn.on {
  background: var(--bg3);
  color: var(--fg0);
  box-shadow: inset 0 0 0 1px var(--line);
}
.icon-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--bg2);
  border: 1px solid var(--line);
  color: var(--fg2);
  font: inherit;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .12s, color .12s;
}
.icon-btn:hover { background: var(--bg3); color: var(--fg0); }
.icon-btn.accent {
  background: var(--accent);
  color: var(--bg0);
  border-color: var(--accent);
  font-weight: 600;
}
.icon-btn.accent:hover { filter: brightness(1.08); background: var(--accent); color: var(--bg0); }
.icon-btn-lbl { font-size: 12px; }

/* ===================== hero ===================== */
.hero {
  background: var(--bg1);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 24px 26px 28px;
  margin-bottom: 22px;
}
.hero-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--mute);
  white-space: nowrap;
}
.hero-date { color: var(--mute); font-size: 12px; }
.hero-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 22px;
}
.stat {
  display: flex; flex-direction: column; gap: 4px;
  padding-left: 14px;
  border-left: 1px solid var(--line);
}
.stat-val {
  font-size: 30px;
  font-weight: 700;
  color: var(--fg0);
  letter-spacing: -0.02em;
  line-height: 1.05;
}
.stat-lbl {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--mute);
}
.stat-hi .stat-val { color: var(--cost); }
.stat-accent .stat-val { color: var(--orange); }

/* ===================== grid + cards ===================== */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 18px;
  margin-bottom: 22px;
}
.card {
  background: var(--bg1);
  border: 1px solid var(--line);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.card-head {
  display: flex; align-items: baseline; justify-content: space-between;
  padding: 14px 18px 8px;
}
.card-head h3 {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--fg2);
  font-weight: 600;
}
.card-hint { font-size: 11px; color: var(--mute); letter-spacing: 0.05em; }
.card-body { padding: 6px 18px 18px; flex: 1; }
.card-body.scroll { max-height: 280px; overflow: auto; }

/* ===================== bar list ===================== */
.bar-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
.bar-row {
  display: grid;
  grid-template-columns: 92px 1fr 56px;
  align-items: center;
  gap: 12px;
}
.bar-label { color: var(--fg1); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-value { color: var(--fg2); text-align: right; font-size: 12.5px; font-variant-numeric: tabular-nums; }
.bar-track {
  height: 8px;
  background: var(--bg2);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}
.bar-fill { height: 100%; border-radius: 2px; }
.bar-yellow { background: var(--yellow); }
.bar-orange { background: var(--orange); }
.bar-aqua   { background: var(--aqua); }
.bar-blue   { background: var(--blue); }
.bar-green  { background: var(--green); }

/* ===================== tables ===================== */
.t-wrap { overflow-x: auto; }
.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}
.tbl th {
  text-align: left;
  font-weight: 500;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--mute);
  padding: 6px 12px 8px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
.tbl td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--line-soft);
  color: var(--fg1);
  white-space: nowrap;
}
.tbl tbody tr:last-child td { border-bottom: 0; }
.tbl tbody tr:hover td { background: var(--bg2); }
.tbl th:first-child, .tbl td:first-child { padding-left: 0; }
.tbl th:last-child,  .tbl td:last-child  { padding-right: 0; }

/* ===================== daily chart ===================== */
.daily-wrap { display: flex; flex-direction: column; gap: 10px; padding-top: 6px; }
.daily-chart {
  display: grid;
  grid-template-columns: repeat(30, 1fr);
  gap: 4px;
  height: 110px;
  align-items: end;
}
.dc-col { height: 100%; display: flex; align-items: end; }
.dc-bar {
  width: 100%;
  background: var(--bg4);
  border-radius: 2px;
  transition: background .15s;
}
.dc-col:hover .dc-bar { background: var(--yellow-d); }
.dc-bar.today { background: var(--yellow); box-shadow: 0 0 0 1px var(--yellow); }
.daily-axis {
  display: flex; justify-content: space-between;
  font-size: 11px; color: var(--mute);
}

/* ===================== footer ===================== */
.footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 24px;
  padding: 18px 22px;
  background: var(--bg1);
  border: 1px solid var(--line);
  border-radius: 10px;
}
.footer-l { display: flex; flex-direction: column; gap: 10px; }
.footer-stats { display: flex; gap: 28px; flex-wrap: wrap; }
.fs { display: flex; align-items: baseline; gap: 8px; }
.fs .v { font-size: 20px; font-weight: 700; color: var(--fg0); letter-spacing: -0.01em; }
.fs .v.cost { color: var(--cost); }
.fs .l { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mute); }
.footer-r { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--mute); }

/* ===================== modal ===================== */
.modal-veil {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 50;
  padding: 24px;
  overflow: auto;
}
.modal {
  background: var(--bg1);
  border: 1px solid var(--line);
  border-radius: 12px;
  max-width: 760px;
  width: 100%;
  overflow: hidden;
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}
.modal-head h2 { margin: 0; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fg0); }
.modal-head p { margin: 4px 0 0; font-size: 11px; color: var(--mute); letter-spacing: 0.06em; }
.modal-actions { display: flex; gap: 8px; }
.btn {
  background: var(--bg2);
  color: var(--fg1);
  border: 1px solid var(--line);
  font: inherit;
  font-size: 12px;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.btn.ghost { background: transparent; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--bg0); font-weight: 600; }
.btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
.modal-body {
  background: var(--bg0);
  padding: 22px;
  display: flex;
  justify-content: center;
}
.share-wrap {
  width: 540px; height: 540px;
  position: relative;
  overflow: hidden;
}
.share-wrap .share-card {
  transform: scale(0.5);
  transform-origin: top left;
}

/* ===================== share card ===================== */
.share-card {
  width: 1080px;
  height: 1080px;
  position: relative;
  font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  padding: 36px;
  box-sizing: border-box;
}
.share-dark { background: #1d2021; color: #ebdbb2; }
.share-light { background: #fbf1c7; color: #3c3836; }
.sc-glow {
  position: absolute; inset: 0;
  border-radius: 56px;
  padding: 3px;
  background: linear-gradient(135deg, #fe8019, #fabd2f 40%, #fe8019 80%, #d65d0e);
  filter: drop-shadow(0 0 30px rgba(254,128,25,0.55)) drop-shadow(0 0 80px rgba(254,128,25,0.25));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
}
.sc-panel {
  position: relative;
  height: 100%;
  width: 100%;
  border-radius: 48px;
  background: #1f2223;
  padding: 64px 72px 56px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.share-light .sc-panel { background: #f9f0d3; }
.sc-brand { display: inline-flex; align-items: center; gap: 14px; margin-bottom: 12px; }
.sc-brand-mark {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fe8019, #d65d0e);
  color: #1d2021;
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  font-size: 30px;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.sc-brand-name { font-size: 26px; font-weight: 600; letter-spacing: -0.01em; color: #ebdbb2; }
.share-light .sc-brand-name { color: #3c3836; }
.sc-title { margin: 4px 0 18px; font-size: 88px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.0; color: #fbf1c7; }
.share-light .sc-title { color: #282828; }
.sc-rule { height: 4px; width: 100%; border-radius: 2px; background: linear-gradient(90deg, #b8bb26 0%, #98971a 60%, transparent 100%); margin-bottom: 36px; }
.share-light .sc-rule { background: linear-gradient(90deg, #79740e 0%, #98971a 60%, transparent 100%); }
.sc-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; margin-bottom: 28px; }
.sc-pair-lbl { display: flex; align-items: center; justify-content: space-between; font-size: 22px; font-weight: 600; color: #d5c4a1; margin-bottom: 6px; }
.share-light .sc-pair-lbl { color: #504945; }
.sc-pair-val { font-size: 80px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.0; font-family: "Space Grotesk", sans-serif; }
.sc-yellow { color: #fabd2f; }
.sc-orange { color: #fe8019; }
.share-light .sc-yellow { color: #b57614; }
.share-light .sc-orange { color: #af3a03; }
.sc-pair-sub { margin-top: 8px; font-size: 18px; color: #928374; }
.share-light .sc-pair-sub { color: #7c6f64; }
.sc-chip { color: #fabd2f; opacity: 0.85; }
.share-light .sc-chip { color: #b57614; }
.sc-pills { display: flex; gap: 20px; margin-bottom: 38px; }
.sc-pill {
  flex: 1;
  display: inline-flex; align-items: center; gap: 12px;
  padding: 18px 24px;
  border-radius: 18px;
  background: #2a2725;
  border: 1px solid #3c3836;
  font-size: 24px;
  color: #ebdbb2;
}
.share-light .sc-pill { background: #f2e5bc; border-color: #d5c4a1; color: #3c3836; }
.sc-pill svg { color: #b8bb26; flex-shrink: 0; }
.share-light .sc-pill svg { color: #79740e; }
.sc-pill-lbl { color: #928374; font-weight: 500; }
.share-light .sc-pill-lbl { color: #7c6f64; }
.sc-pill-val { font-weight: 700; color: #fbf1c7; }
.share-light .sc-pill-val { color: #282828; }
.sc-chart-h { font-size: 28px; font-weight: 600; color: #ebdbb2; margin-bottom: 18px; letter-spacing: -0.01em; }
.share-light .sc-chart-h { color: #3c3836; }
.sc-chart { flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); gap: 16px; align-items: end; min-height: 220px; }
.sc-bar-col { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: end; }
.sc-bar-val { font-family: "JetBrains Mono", monospace; font-size: 16px; color: #d5c4a1; margin-bottom: 8px; font-weight: 500; }
.share-light .sc-bar-val { color: #504945; }
.sc-bar { width: 100%; border-radius: 10px 10px 4px 4px; min-height: 8px; }
.sc-bar-low  { background: #689d6a; }
.sc-bar-mid  { background: #fabd2f; }
.sc-bar-high { background: #d79921; }
.sc-bar-peak { background: #fe8019; }
.share-light .sc-bar-low  { background: #79740e; }
.share-light .sc-bar-mid  { background: #d79921; }
.share-light .sc-bar-high { background: #af3a03; }
.share-light .sc-bar-peak { background: #af3a03; }
.sc-bar-today { box-shadow: 0 0 24px rgba(254,128,25,0.6); }
.sc-bar-dow { margin-top: 10px; font-size: 18px; font-weight: 500; color: #928374; }
.share-light .sc-bar-dow { color: #7c6f64; }
.sc-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; padding-top: 18px; border-top: 1px solid #32302f; font-size: 16px; color: #928374; font-family: "JetBrains Mono", monospace; }
.share-light .sc-foot { border-color: #ebdbb2; color: #7c6f64; }
.sc-foot-r { color: #fabd2f; }
.share-light .sc-foot-r { color: #b57614; }

/* ===================== responsive ===================== */
@media (max-width: 900px) {
  .page { padding: 18px; }
  .hero-grid { grid-template-columns: repeat(3, 1fr); }
  .grid > .card { grid-column: span 12 !important; }
  .footer { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 560px) {
  .hero-grid { grid-template-columns: repeat(2, 1fr); }
  .topbar { flex-direction: column; align-items: stretch; gap: 12px; }
  .topbar-r { justify-content: space-between; flex-wrap: wrap; }
  .icon-btn-lbl { display: none; }
}
`;
