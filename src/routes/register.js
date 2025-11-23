import express from "express";
import crypto from "node:crypto";
import argon2 from "argon2";
import { insertUser } from "../db.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, email } = req.body || {};

  if (!username || !email) {
    return res.status(400).json({ error: "username and email are required" });
  }

  const password = crypto.randomUUID(); 

  try {
    const password_hash = await argon2.hash(password);
    insertUser.run({ username, email, password_hash });
  } catch (err) {

    console.error(err);
    return res.status(400).json({ error: "could not register user" });
  }

  return res.status(201).json({ password });
});

export default router;
