import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'numerica.db');

// Ensure the data directory exists
import fs from 'node:fs';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT,
    expression TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export const historyStore = {
  add(module, expression, result) {
    const stmt = db.prepare('INSERT INTO history (module, expression, result) VALUES (?, ?, ?)');
    const info = stmt.run(module ?? null, expression, result);
    return this.getById(info.lastInsertRowid);
  },
  getById(id) {
    return db.prepare('SELECT * FROM history WHERE id = ?').get(id);
  },
  list(limit = 100) {
    return db.prepare('SELECT * FROM history ORDER BY id DESC LIMIT ?').all(limit);
  },
  remove(id) {
    return db.prepare('DELETE FROM history WHERE id = ?').run(id);
  },
  clear() {
    return db.prepare('DELETE FROM history').run();
  }
};
