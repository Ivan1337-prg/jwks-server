// src/routes/register.js
import express from "express";
import { v4 as uuidv4 } from "uuid";
import argon2 from "argon2";
import { insertUser } from "../db.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, email } = req.body || {};

  if (!username || !email) {
    return res.status(400).json({ error: "username and email are required" });
  }

  const password = uuidv4();

  try {
    const password_hash = await argon2.hash(password);

    insertUser.run({ username, email, password_hash });

    // OK or CREATED is fine per spec – use 201
    res.status(201).json({ password });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "user already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "failed to register user" });
  }
});

export default router;
