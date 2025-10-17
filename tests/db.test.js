// lightweight DB existence + expired token kid check
import fs from 'fs'
import path from 'path'
import request from 'supertest'
import app, { appReady } from '../src/server.js'
import { getExpiredKey } from '../src/keys.js'

const DB_FILE = path.join(process.cwd(), 'totally_not_my_privateKeys.db')

beforeAll(async () => { await appReady })

describe('SQLite backing (presence & behavior)', () => {
  it('creates the SQLite DB file at startup', () => {
    expect(fs.existsSync(DB_FILE)).toBe(true)
    const stats = fs.statSync(DB_FILE)
    expect(stats.size).toBeGreaterThan(0)
  })

  it('expired token is signed by the expired key (kid matches)', async () => {
    const expired = getExpiredKey()
    expect(expired).toBeTruthy()

    const { body } = await request(app).post('/auth?expired=true').expect(200)
    // header is a JWT header (first segment)
    const header = JSON.parse(Buffer.from(body.token.split('.')[0], 'base64url').toString('utf8'))
    expect(header.kid).toBe(expired.kid)
    expect(header.alg).toBe('RS256')
  })
})
