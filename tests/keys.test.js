//tests key helpers for active, expired, and edge cases
import {
  initializeKeys,
  getActivePublicJwks,
  getCurrentSigningKey,
  getExpiredKey
} from '../src/keys.js'

beforeAll(async () => {
  await initializeKeys()
})

describe('keys helpers', () => {
  it('returns non-expired public JWKs', () => {
    const ks = getActivePublicJwks()
    expect(Array.isArray(ks)).toBe(true)
    expect(ks.length).toBeGreaterThan(0)
    for (const jwk of ks) {
      expect(jwk.kty).toBe('RSA')
      expect(jwk.alg).toBe('RS256')
      expect(jwk).toHaveProperty('kid')
      expect(jwk).not.toHaveProperty('d')
    }
  })

  it('current signing key is active', () => {
    const k = getCurrentSigningKey()
    expect(k).toBeTruthy()
    expect(k.expiresAt > new Date()).toBe(true)
  })

  it('expired key exists', () => {
    const k = getExpiredKey()
    expect(k).toBeTruthy()
    expect(k.expiresAt <= new Date()).toBe(true)
  })

  it('returns empty array when no active keys', () => {
    const RealDate = Date
    global.Date = class extends RealDate {
      constructor(...args) { return args.length ? new RealDate(...args) : new RealDate(3000, 0, 1) }
      static now() { return new RealDate(3000, 0, 1).getTime() }
    }
    const ks = getActivePublicJwks()
    expect(ks.length).toBe(0)
    global.Date = RealDate
  })

  it('getExpiredKey returns null when no keys are expired', () => {
    const RealDate = Date
    global.Date = class extends RealDate {
      constructor(...args) { return args.length ? new RealDate(...args) : new RealDate(2000, 0, 1) }
      static now() { return new RealDate(2000, 0, 1).getTime() }
    }
    const k = getExpiredKey()
    expect(k).toBeNull()
    global.Date = RealDate
  })
})
