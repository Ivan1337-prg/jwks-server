//tests /auth for valid, expired, and error cases
import request from 'supertest'
import { createLocalJWKSet, jwtVerify } from 'jose'
import { jest } from '@jest/globals'

//real app, real keys
const realServer = await import('../src/server.js')
const app = realServer.default
await realServer.appReady

const verifyWithServerJwks = async (token) => {
  const jwksRes = await request(app).get('/jwks').expect(200)
  const JWKS = createLocalJWKSet(jwksRes.body)
  return jwtVerify(token, JWKS, { algorithms: ['RS256'] })
}

describe('AUTH endpoint (real keys)', () => {
  it('POST /auth → valid token verifiable via /jwks', async () => {
    const { body } = await request(app).post('/auth').expect(200)
    expect(typeof body.token).toBe('string')
    const out = await verifyWithServerJwks(body.token)
    expect(out.payload.sub).toBe('fake-user-123')
    expect(out.protectedHeader.kid).toBeTruthy()
  })

  it('POST /auth?expired=true → token fails verification (expired)', async () => {
    const { body } = await request(app).post('/auth?expired=true').expect(200)
    let failed = false
    try { await verifyWithServerJwks(body.token) } catch { failed = true }
    expect(failed).toBe(true)
  })
})

//app with mocked keys -> force 500 path
describe('AUTH endpoint (no signing key → 500)', () => {
  let appErr

  beforeAll(async () => {
    jest.resetModules()

    //mock the keys module before importing the server
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

  it('POST /auth → 500 when no signing key is available', async () => {
    const res = await request(appErr).post('/auth').expect(500)
    expect(res.body).toHaveProperty('error')
  })
})
