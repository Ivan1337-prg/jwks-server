import express from "express";
import { signJwt } from "../keys.js";
import { insertAuthLog } from "../db.js";

const router = express.Router();

const WINDOW_MS = 1000;
const MAX_REQUESTS = 10;
const buckets = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket || now - bucket.start >= WINDOW_MS) {
    bucket = { start: now, count: 0 };
    buckets.set(ip, bucket);
  }

  bucket.count += 1;
  return bucket.count <= MAX_REQUESTS;
}

router.post("/auth", async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too Many Requests" });
  }

  const expired = req.query.expired === "true";

  try {
    const token = await signJwt(expired);

    insertAuthLog.run({ request_ip: ip, user_id: 1 });

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to issue token" });
  }
});

export default router;
