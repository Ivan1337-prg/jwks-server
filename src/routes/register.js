// User registration endpoint.
import express from 'express';
import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { insertUser } from '../db.js';

const r = express.Router();

/**
 * POST /register
 * Body: { "username": "...", "email": "..." }
 * Response: { "password": "<generated-uuid>" }
 */
r.post('/register', async (req, res, next) => {
  try {
    const { username, email } = req.body || {};
    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

    const plainPassword = randomUUID();
    const password_hash = await argon2.hash(plainPassword);

    insertUser.run({ username, email, password_hash });

    return res.status(201).json({ password: plainPassword });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'username or email already exists' });
    }
    next(err);
  }
});

export default r;
