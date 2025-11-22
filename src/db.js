// src/db.js
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "..", "totally_not_my_privateKeys.db");
export const db = new Database(DB_FILE);

// --- schema ------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS keys(
  kid TEXT PRIMARY KEY,
  priv BLOB NOT NULL,          -- AES ciphertext
  iv   BLOB NOT NULL,          -- AES IV
  tag  BLOB NOT NULL,          -- AES GCM tag
  exp  INTEGER NOT NULL,       -- unix seconds
  public_jwk TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_ip TEXT NOT NULL,
  request_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

// --- keys helpers ------------------------------------------------------
export const insertKey = db.prepare(`
  INSERT OR REPLACE INTO keys (kid, priv, iv, tag, exp, public_jwk)
  VALUES (@kid, @priv, @iv, @tag, @exp, @public_jwk)
`);

export const getNewestValidKey = db.prepare(`
  SELECT * FROM keys
  WHERE exp > strftime('%s','now')
  ORDER BY exp DESC
  LIMIT 1
`);

export const getExpiredKey = db.prepare(`
  SELECT * FROM keys
  WHERE exp <= strftime('%s','now')
  ORDER BY exp DESC
  LIMIT 1
`);

export const getAllValidPublicJwks = db.prepare(`
  SELECT public_jwk FROM keys
  WHERE exp > strftime('%s','now')
`);

// --- users -------------------------------------------------------------
export const insertUser = db.prepare(`
  INSERT INTO users (username, email, password_hash)
  VALUES (@username, @email, @password_hash)
`);

export const getUserByUsername = db.prepare(`
  SELECT * FROM users WHERE username = ?
`);

// --- auth logs ---------------------------------------------------------
export const insertAuthLog = db.prepare(`
  INSERT INTO auth_logs (request_ip, user_id)
  VALUES (@request_ip, @user_id)
`);
