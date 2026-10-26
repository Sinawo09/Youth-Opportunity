const Database = require('better-sqlite3');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const defaultPath = path.join(__dirname, '..', 'data', 'portal.sqlite');
const databasePath = process.env.SQLITE_DB_PATH || defaultPath;
if (databasePath !== ':memory:') fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
if (databasePath !== ':memory:') db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
const opportunityColumns = new Set(db.pragma('table_info(opportunities)').map((column) => column.name));
for (const [name, definition] of [
  ['minimum_qualification', "TEXT NOT NULL DEFAULT ''"],
  ['date_checked', 'TEXT'],
  ['verification_status', "TEXT NOT NULL DEFAULT 'unverified'"]
]) {
  if (!opportunityColumns.has(name)) db.exec(`ALTER TABLE opportunities ADD COLUMN ${name} ${definition}`);
}

function now() {
  return new Date().toISOString();
}

function newId() {
  return crypto.randomUUID();
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )
`);
const migrationDirectory = path.join(__dirname, 'migrations');
for (const file of fs.readdirSync(migrationDirectory).filter((name) => name.endsWith('.sql')).sort()) {
  if (db.prepare('SELECT 1 FROM schema_migrations WHERE id = ?').get(file)) continue;
  const migration = fs.readFileSync(path.join(migrationDirectory, file), 'utf8');
  db.transaction(() => {
    db.exec(migration);
    db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(file, now());
  })();
}
db.prepare(`
  UPDATE opportunities
  SET is_published = 0, verification_status = 'expired'
  WHERE verification_status = 'verified' AND date(application_deadline) < date('now')
`).run();

module.exports = { db, hashToken, newId, now };