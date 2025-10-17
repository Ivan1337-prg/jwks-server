// SQLite layer: creates DB, seeds keys, safe queries
import Database from 'better-sqlite3'
import { generateKeyPairSync, createPrivateKey, createPublicKey } from 'node:crypto'
import { exportJWK } from 'jose'

export const DB_FILE = 'totally_not_my_privateKeys.db'

const db = new Database(DB_FILE)
db.pragma('journal_mode = WAL')

db.prepare(`
  CREATE TABLE IF NOT EXISTS keys(
    kid INTEGER PRIMARY KEY AUTOINCREMENT,
    key BLOB NOT NULL,
    exp INTEGER NOT NULL
  )
`).run()

const insertKeyStmt = db.prepare('INSERT INTO keys(key, exp) VALUES(?, ?)')
const selectValidStmt = db.prepare('SELECT kid, key, exp FROM keys WHERE exp > ? ORDER BY exp DESC')
const selectExpiredStmt = db.prepare('SELECT kid, key, exp FROM keys WHERE exp <= ? ORDER BY exp DESC')
const selectCurrentStmt = db.prepare('SELECT kid, key, exp FROM keys WHERE exp > ? ORDER BY exp DESC LIMIT 1')
const selectOneExpiredStmt = db.prepare('SELECT kid, key, exp FROM keys WHERE exp <= ? ORDER BY exp DESC LIMIT 1')

const nowSeconds = () => Math.floor(Date.now() / 1000)
const inMins = m => nowSeconds() + m * 60

export function insertPrivateKeyPem(pem, expSec) {
  const info = insertKeyStmt.run(pem, expSec)
  return info.lastInsertRowid
}

export function listValidRows() {
  return selectValidStmt.all(nowSeconds())
}

export function listExpiredRows() {
  return selectExpiredStmt.all(nowSeconds())
}

export function getCurrentValidRow() {
  return selectCurrentStmt.get(nowSeconds()) || null
}

export function getOneExpiredRow() {
  return selectOneExpiredStmt.get(nowSeconds()) || null
}

export async function rowToPublicJwk(row) {
  const priv = createPrivateKey(row.key.toString())
  const pub = createPublicKey(priv)
  const jwk = await exportJWK(pub)
  jwk.kid = String(row.kid)
  jwk.alg = 'RS256'
  jwk.use = 'sig'
  return jwk
}

// Ensure at least one expired & one valid key exist
export function seedIfNeeded() {
  const haveValid = listValidRows().length > 0
  const haveExpired = listExpiredRows().length > 0
  if (haveValid && haveExpired) return

  const gen = () => generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  })

  if (!haveValid) {
    const { privateKey } = gen()
    insertPrivateKeyPem(privateKey, inMins(60))
  }
  if (!haveExpired) {
    const { privateKey } = gen()
    insertPrivateKeyPem(privateKey, inMins(-10))
  }
}

export default db
