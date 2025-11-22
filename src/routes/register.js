// src/routes/register.js
import express from "express";
import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import { insertUser } from "../db.js";

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { username, email } = req.body || {};
    if (!username || !email) {
      return res.status(400).json({ error: "username and email are required" });
    }

    const password = randomUUID();
    const passwordHash = await argon2.hash(password);

    insertUser.run({ username, email, password_hash: passwordHash });

    res.status(201).json({ password });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res
        .status(409)
        .json({ error: "username or email already exists" });
    }
    next(err);
  }
});

export default router;
