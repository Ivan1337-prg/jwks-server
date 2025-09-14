//creates RSA keys with kid + expiry, and fetches active/expired ones
import { randomUUID } from 'crypto'
import { generateKeyPair, exportJWK } from 'jose'

const store = []
const inMins = m => new Date(Date.now() + m * 60000)

export async function initializeKeys () {
  const make = async m => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const jwk = await exportJWK(publicKey)
    const kid = randomUUID()
    Object.assign(jwk, { kid, alg: 'RS256', use: 'sig' })
    store.push({ kid, privateKey, publicJwk: jwk, expiresAt: inMins(m) })
  }
  await Promise.all([make(60), make(-10)])
}

export const getActivePublicJwks = () =>
  store.filter(k => k.expiresAt > new Date()).map(k => k.publicJwk)

export const getCurrentSigningKey = () =>
  store.filter(k => k.expiresAt > new Date()).sort((a, b) => b.expiresAt - a.expiresAt)[0] || null

export const getExpiredKey = () =>
  store.find(k => k.expiresAt <= new Date()) || null
