import express from 'express'
import { SignJWT } from 'jose'
import { getCurrentSigningKey, getExpiredKey } from '../keys.js'

const r = express.Router()

r.post('/auth', async (req, res) => {
  const expired = String(req.query.expired).toLowerCase() === 'true'
  const now = Math.floor(Date.now() / 1000)

  const key = expired ? getExpiredKey() : getCurrentSigningKey()
  if (!key) return res.status(500).json({ error: 'No signing key' })

  const iat = expired ? now - 120 : now
  const exp = expired ? now - 60 : now + 900

  const token = await new SignJWT({ sub: 'fake-user-123', scope: 'read:stuff', iat, exp })
    .setProtectedHeader({ alg: 'RS256', kid: key.kid, typ: 'JWT' })
    .sign(key.privateKey)

  res.json({ token })
})

r.all('/auth', (req, res) => res.status(405).json({ error: 'Method Not Allowed' }))

export default r
