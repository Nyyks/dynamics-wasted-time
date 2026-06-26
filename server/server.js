const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new Database(path.join(DATA_DIR, 'leaderboard.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username    TEXT PRIMARY KEY,
    total_seconds INTEGER NOT NULL DEFAULT 0,
    today_seconds INTEGER NOT NULL DEFAULT 0,
    last_seen   INTEGER NOT NULL DEFAULT 0
  )
`);

app.use(cors());
app.use(express.json({ limit: '16kb' }));

// POST /api/stats  —  upsert a user's numbers
app.post('/api/stats', (req, res) => {
  const { username, totalSeconds, todaySeconds } = req.body;

  if (
    typeof username !== 'string' ||
    username.trim().length === 0 ||
    typeof totalSeconds !== 'number' ||
    typeof todaySeconds !== 'number'
  ) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const name = username.trim().slice(0, 50);
  const now = Date.now();

  // Rate-limit: ignore updates more frequent than once per 30 s per user
  const existing = db.prepare('SELECT last_seen FROM users WHERE username = ?').get(name);
  if (existing && now - existing.last_seen < 30_000) {
    return res.json({ success: true });
  }

  db.prepare(`
    INSERT INTO users (username, total_seconds, today_seconds, last_seen)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      total_seconds = excluded.total_seconds,
      today_seconds = excluded.today_seconds,
      last_seen     = excluded.last_seen
  `).run(name, Math.max(0, Math.floor(totalSeconds)), Math.max(0, Math.floor(todaySeconds)), now);

  res.json({ success: true });
});

// GET /api/leaderboard  —  top 100 by total time
app.get('/api/leaderboard', (req, res) => {
  const rows = db.prepare(`
    SELECT username, total_seconds, today_seconds, last_seen
    FROM users
    ORDER BY total_seconds DESC
    LIMIT 100
  `).all();

  res.json(rows.map((row, i) => ({
    rank: i + 1,
    username: row.username,
    totalSeconds: row.total_seconds,
    todaySeconds: row.today_seconds,
    lastSeen: row.last_seen
  })));
});

// GET /health
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Leaderboard server listening on port ${PORT}`));
