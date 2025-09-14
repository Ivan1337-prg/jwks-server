//tests /jwks only returns valid keys
import request from 'supertest'
import app from '../src/server.js'
import { getActivePublicJwks } from '../src/keys.js'

it('returns only non-expired JWKs', async () => {
  const res = await request(app).get('/jwks').expect(200)
  const { keys } = res.body
  expect(Array.isArray(keys)).toBe(true)
  expect(keys.length).toBe(getActivePublicJwks().length)
  for (const jwk of keys) {
    expect(jwk.kty).toBe('RSA')
    expect(jwk.alg).toBe('RS256')
    expect(jwk).toHaveProperty('kid')
    expect(jwk).not.toHaveProperty('d')
  }
})
