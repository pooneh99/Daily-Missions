// Uses Node 22+ built-in SQLite (no native compilation required)
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'missions.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY,
    xp INTEGER DEFAULT 720,
    last_opened TEXT
  );

  CREATE TABLE IF NOT EXISTS missions (
    id INTEGER PRIMARY KEY,
    label TEXT,
    streak INTEGER DEFAULT 0,
    last_completed TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT,
    content TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed stats row
const statsRow = db.prepare('SELECT id FROM stats WHERE id = ?').get(1);
if (!statsRow) {
  db.prepare('INSERT INTO stats (id, xp, last_opened) VALUES (1, 720, NULL)').run();
}

// Seed mission rows
const MISSION_SEEDS = [
  { id: 1, label: 'Job hunt' },
  { id: 2, label: 'Exercise' },
  { id: 3, label: 'Cook a meal' },
  { id: 4, label: 'Clean & tidy' },
  { id: 5, label: 'Self care' },
];

for (const m of MISSION_SEEDS) {
  const existing = db.prepare('SELECT id FROM missions WHERE id = ?').get(m.id);
  if (!existing) {
    db.prepare('INSERT INTO missions (id, label, streak, last_completed) VALUES (?, ?, 0, NULL)')
      .run(m.id, m.label);
  }
}

module.exports = db;
