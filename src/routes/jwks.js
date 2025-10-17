import express from 'express'
import { getActivePublicJwks } from '../keys.js'

const r = express.Router()
const send = async (req, res) => {
  const keys = await getActivePublicJwks()
  res.status(200).json({ keys })
}

const paths = ['/.well-known/jwks.json', '/jwks']
r.get(paths, send)
r.all(paths, (req, res) => res.status(405).json({ error: 'Method Not Allowed' }))

export default r
