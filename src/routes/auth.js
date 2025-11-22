// src/routes/auth.js
import express from "express";
import { signJwt } from "../keys.js";
import { getUserByUsername, insertAuthLog } from "../db.js";

const router = express.Router();

// --- simple in-memory rate limiter: 10 / second -------------------
const WINDOW_MS = 1000;
const MAX_REQUESTS = 10;
let timestamps = [];

router.post("/auth", async (req, res) => {
  const now = Date.now();
  timestamps = timestamps.filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) {
    // optional requirement: 429 Too Many Requests
    return res.status(429).send("Too Many Requests");
  }
  timestamps.push(now);

  const expired = req.query.expired === "true";

  // Basic auth parsing (still just mocked auth)
  let username = "userABC";

  const header = req.headers.authorization || "";
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const [u] = decoded.split(":");
    if (u) username = u;
  }

  try {
    const token = await signJwt({ username, expired });

    // Only successful requests are logged
    const user = getUserByUsername.get(username);
    insertAuthLog.run({
      request_ip: req.ip || req.socket.remoteAddress || "",
      user_id: user ? user.id : null
    });

    // project 1/2 client expects raw JWT body
    res.send(token);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to sign JWT" });
  }
});

export default router;
