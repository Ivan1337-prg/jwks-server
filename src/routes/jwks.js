//jwks -> returns non-expired public keys
import express from 'express'
import { getActivePublicJwks } from '../keys.js'

const r = express.Router()
r.get('/jwks', (_req, res) => res.json({ keys: getActivePublicJwks() }))
export default r
