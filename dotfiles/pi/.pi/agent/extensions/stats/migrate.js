#!/usr/bin/env node
/**
 * migrate.js — one-time import from the "pi copy" stats.db
 *
 * Copies all rows from the source DB into ~/.pi/agent/stats.db.
 * Safe to run multiple times — INSERT OR IGNORE / NOT EXISTS guards prevent duplicates.
 * New columns (tokens_input, tokens_output, tokens_cache_read, tokens_cache_write, branch)
 * will default to 0 / '' for migrated rows since the source never captured them.
 *
 * Usage:
 *   node migrate.js [source_db_path]
 *
 * Default source:
 *   ~/Documents/Coding/Projects/setthemacup/dotfiles/pi copy/.pi/agent/stats.db
 */

"use strict";

const { DatabaseSync } = require("node:sqlite");
const { mkdirSync, existsSync } = require("node:fs");
const { homedir } = require("node:os");
const { join } = require("node:path");

// ── Paths ─────────────────────────────────────────────────────────────────────

const SRC_DEFAULT = join(
  homedir(),
  "Documents/Coding/Projects/setthemacup/dotfiles/pi copy/.pi/agent/stats.db",
);
const SRC  = process.argv[2] ?? SRC_DEFAULT;
const DEST = join(homedir(), ".pi", "agent", "stats.db");

if (!existsSync(SRC)) {
  console.error(`Source DB not found: ${SRC}`);
  process.exit(1);
}

console.log(`Source : ${SRC}`);
console.log(`Dest   : ${DEST}`);
console.log();

// ── Open / init dest ──────────────────────────────────────────────────────────

mkdirSync(join(homedir(), ".pi", "agent"), { recursive: true });
const dest = new DatabaseSync(DEST);
dest.exec("PRAGMA journal_mode = WAL");
dest.exec("PRAGMA synchronous = NORMAL");

// Ensure dest schema is fully up to date (idempotent)
dest.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT    PRIMARY KEY,
    started_at  INTEGER NOT NULL,
    ended_at    INTEGER,
    duration    INTEGER,
    cwd         TEXT,
    turns       INTEGER DEFAULT 0,
    tokens      INTEGER DEFAULT 0,
    cost        REAL    DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS session_models (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT    NOT NULL,
    provider    TEXT,
    model_id    TEXT,
    selected_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS session_tools (
    session_id TEXT NOT NULL,
    tool       TEXT NOT NULL,
    count      INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (session_id, tool)
  );
  CREATE TABLE IF NOT EXISTS session_commands (
    session_id TEXT NOT NULL,
    command    TEXT NOT NULL,
    count      INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (session_id, command)
  );
  CREATE TABLE IF NOT EXISTS session_skills (
    session_id TEXT NOT NULL,
    skill      TEXT NOT NULL,
    count      INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (session_id, skill)
  );
  CREATE TABLE IF NOT EXISTS user_inputs (
    id                  TEXT    PRIMARY KEY,
    session_id          TEXT    NOT NULL,
    started_at          INTEGER NOT NULL,
    ended_at            INTEGER,
    time_ms             INTEGER,
    tokens_used         INTEGER DEFAULT 0,
    tokens_input        INTEGER DEFAULT 0,
    tokens_output       INTEGER DEFAULT 0,
    tokens_cache_read   INTEGER DEFAULT 0,
    tokens_cache_write  INTEGER DEFAULT 0,
    provider            TEXT,
    model_id            TEXT,
    branch              TEXT    DEFAULT '',
    tools               TEXT    DEFAULT '{}',
    commands            TEXT    DEFAULT '{}',
    skills              TEXT    DEFAULT '{}',
    cost_usd            REAL    DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_ui_session   ON user_inputs (session_id);
  CREATE INDEX IF NOT EXISTS idx_ui_started   ON user_inputs (started_at);
  CREATE INDEX IF NOT EXISTS idx_sess_started ON sessions    (started_at);
`);

// Additive column migrations (safe no-ops if columns already exist)
const addCol = (table, col, def) => {
  try { dest.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch { /* exists */ }
};
addCol("user_inputs", "tokens_input",       "INTEGER DEFAULT 0");
addCol("user_inputs", "tokens_output",      "INTEGER DEFAULT 0");
addCol("user_inputs", "tokens_cache_read",  "INTEGER DEFAULT 0");
addCol("user_inputs", "tokens_cache_write", "INTEGER DEFAULT 0");
addCol("user_inputs", "branch",             "TEXT DEFAULT ''");

// ── Count before ──────────────────────────────────────────────────────────────

const before = {};
for (const t of ["sessions","session_models","session_tools","session_commands","session_skills","user_inputs"]) {
  before[t] = dest.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
}

// ── ATTACH + migrate ──────────────────────────────────────────────────────────

// Escape single quotes in path for SQL
const safeSrc = SRC.replace(/'/g, "''");
dest.exec(`ATTACH DATABASE '${safeSrc}' AS src`);

dest.exec("BEGIN TRANSACTION");
try {
  // sessions — PK on id, INSERT OR IGNORE is safe
  dest.prepare(`
    INSERT OR IGNORE INTO sessions
    SELECT * FROM src.sessions
  `).run();

  // session_models — AUTOINCREMENT id, use NOT EXISTS to stay idempotent
  dest.prepare(`
    INSERT INTO session_models (session_id, provider, model_id, selected_at)
    SELECT s.session_id, s.provider, s.model_id, s.selected_at
    FROM src.session_models s
    WHERE NOT EXISTS (
      SELECT 1 FROM session_models d
      WHERE d.session_id  = s.session_id
        AND d.model_id    = s.model_id
        AND d.selected_at = s.selected_at
    )
  `).run();

  // session_tools — composite PK (session_id, tool)
  dest.prepare(`
    INSERT OR IGNORE INTO session_tools
    SELECT * FROM src.session_tools
  `).run();

  // session_commands
  dest.prepare(`
    INSERT OR IGNORE INTO session_commands
    SELECT * FROM src.session_commands
  `).run();

  // session_skills
  dest.prepare(`
    INSERT OR IGNORE INTO session_skills
    SELECT * FROM src.session_skills
  `).run();

  // user_inputs — explicit columns: source has no tokens_input/output/cache/branch,
  // so those default to 0 / '' for migrated rows.
  dest.prepare(`
    INSERT OR IGNORE INTO user_inputs
      (id, session_id, started_at, ended_at, time_ms,
       tokens_used, provider, model_id,
       tools, commands, skills, cost_usd)
    SELECT
      id, session_id, started_at, ended_at, time_ms,
      tokens_used, provider, model_id,
      tools, commands, skills, cost_usd
    FROM src.user_inputs
  `).run();

  dest.exec("COMMIT");
} catch (e) {
  dest.exec("ROLLBACK");
  dest.exec("DETACH DATABASE src");
  console.error("Migration failed, rolled back:", e.message);
  process.exit(1);
}

dest.exec("DETACH DATABASE src");

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("Table                  before    after   imported");
console.log("─".repeat(52));
for (const t of Object.keys(before)) {
  const after    = dest.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  const imported = after - before[t];
  console.log(
    t.padEnd(22),
    String(before[t]).padStart(6),
    String(after).padStart(8),
    String(imported > 0 ? `+${imported}` : "—").padStart(10),
  );
}
console.log();
console.log("Done. New columns (tokens_input, tokens_output, cache_read, cache_write, branch)");
console.log("default to 0 / '' for migrated rows — source never captured them.");
