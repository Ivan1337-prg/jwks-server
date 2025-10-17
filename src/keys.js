// Keys facade used by routes; now backed by SQLite
import {
  seedIfNeeded,
  listValidRows,
  getCurrentValidRow,
  getOneExpiredRow,
  rowToPublicJwk
} from './db.js'
import { createPrivateKey } from 'node:crypto'

export async function initializeKeys() {
  seedIfNeeded()
}

export async function getActivePublicJwks() {
  const rows = listValidRows()
  const jwks = await Promise.all(rows.map(rowToPublicJwk))
  return jwks
}

export function getCurrentSigningKey() {
  const row = getCurrentValidRow()
  if (!row) return null
  return { kid: String(row.kid), privateKey: createPrivateKey(row.key.toString()) }
}

export function getExpiredKey() {
  const row = getOneExpiredRow()
  if (!row) return null
  return { kid: String(row.kid), privateKey: createPrivateKey(row.key.toString()) }
}
