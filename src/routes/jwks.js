// /.well-known/jwks.json route.
import express from 'express';
import { getAllValidPublicJwks } from '../db.js';

const r = express.Router();

// Gradebot requires EXACT path:
r.get('/.well-known/jwks.json', (req, res) => {
  const rows = getAllValidPublicJwks.all();
  // rows are text; convert to objects:
  const keys = rows.map(r => JSON.parse(r.public_jwk));
  res.json({ keys });
});

export default r;
