// tests /auth for valid, expired, and error paths
import request from 'supertest'
import { createLocalJWKSet, jwtVerify } from 'jose'
import { jest } from '@jest/globals'

// Load the real app (and wait for key init)
const real = await import('../src/server.js')
const app = real.default
await real.appReady

const verifyWithServerJwks = async (token) => {
  const jwks = await request(app).get('/jwks').expect(200)
  const JWKS = createLocalJWKSet(jwks.body)
  return jwtVerify(token, JWKS, { algorithms: ['RS256'] })
}

describe('AUTH endpoint (real keys)', () => {
  it('POST /auth → returns a valid token verifiable via /jwks', async () => {
    const { body } = await request(app).post('/auth').expect(200)
    expect(typeof body.token).toBe('string')

    const out = await verifyWithServerJwks(body.token)
    expect(out.payload.sub).toBe('fake-user-123')
    expect(out.protectedHeader.kid).toBeTruthy()
    expect(out.protectedHeader.alg).toBe('RS256')
    expect(out.protectedHeader.typ).toBe('JWT')
  })

  it('POST /auth?expired=true → token fails verification (expired)', async () => {
    const { body } = await request(app).post('/auth?expired=true').expect(200)
    let failed = false
    try { await verifyWithServerJwks(body.token) } catch { failed = true }
    expect(failed).toBe(true)
  })
})

describe('AUTH endpoint (forced 500 when no signing key)', () => {
  let appErr

  beforeAll(async () => {
    jest.resetModules()

    // mock keys to simulate "no current signing key" path
    jest.unstable_mockModule('../src/keys.js', () => ({
      initializeKeys: async () => {},
      getActivePublicJwks: () => [],
      getCurrentSigningKey: () => null,
      getExpiredKey: () => null
    }))

    const mod = await import('../src/server.js')
    appErr = mod.default
    await mod.appReady
  })

  it('POST /auth → 500 with helpful error payload', async () => {
    const res = await request(appErr).post('/auth').expect(500)
    expect(res.body).toHaveProperty('error')
    expect(typeof res.body.error).toBe('string')
  })
})
