const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'kissan.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farmers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      address TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS wheat_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      crop_type TEXT DEFAULT 'Wheat',
      wheat_variety TEXT,
      bags INTEGER DEFAULT 0,
      quantity REAL NOT NULL DEFAULT 0,
      rate REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      advance_rate REAL DEFAULT 0,
      previous_advance REAL DEFAULT 0,
      advance_payment REAL DEFAULT 0,
      bonus_rate REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      entry_date TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  const farmerColumns = db.prepare("PRAGMA table_info(farmers)").all().map(c => c.name);
  const droppedColumns = ['village', 'land_area', 'crop_type', 'aadhar_no', 'registration_date'];
  for (const col of droppedColumns) {
    if (farmerColumns.includes(col)) {
      db.exec(`ALTER TABLE farmers DROP COLUMN ${col}`);
    }
  }

  const wheatEntryColumns = db.prepare("PRAGMA table_info(wheat_entries)").all().map(c => c.name);
  if (wheatEntryColumns.includes('advance') && !wheatEntryColumns.includes('advance_payment')) {
    db.exec('ALTER TABLE wheat_entries ADD COLUMN previous_advance REAL DEFAULT 0');
    db.exec('ALTER TABLE wheat_entries ADD COLUMN advance_payment REAL DEFAULT 0');
    db.exec('UPDATE wheat_entries SET advance_payment = advance');
    db.exec('ALTER TABLE wheat_entries DROP COLUMN advance');
  }

  if (wheatEntryColumns.includes('advance_payment') && !wheatEntryColumns.includes('advance_rate')) {
    db.exec('ALTER TABLE wheat_entries ADD COLUMN advance_rate REAL DEFAULT 0');
  }

  if (wheatEntryColumns.includes('bonus') && !wheatEntryColumns.includes('bonus_rate')) {
    db.exec('ALTER TABLE wheat_entries ADD COLUMN bonus_rate REAL DEFAULT 0');
  }

  if (!wheatEntryColumns.includes('crop_type')) {
    db.exec("ALTER TABLE wheat_entries ADD COLUMN crop_type TEXT DEFAULT 'Wheat'");
  }

  const oldTransactionsTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'"
  ).get();
  if (oldTransactionsTable) {
    db.exec('DROP TABLE transactions');
  }

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    const hashed = bcrypt.hashSync('admin123', 10);
    db.prepare(
      'INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)'
    ).run('admin', hashed, 'Administrator');
    console.log('Default admin user created -> username: admin, password: admin123');
  }
}

init();

module.exports = db;
