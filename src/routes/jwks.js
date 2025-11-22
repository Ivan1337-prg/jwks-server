// src/routes/jwks.js
import express from "express";
import { getActivePublicJwks } from "../keys.js";

const router = express.Router();

router.get("/.well-known/jwks.json", (req, res) => {
  const keys = getActivePublicJwks();
  res.json({ keys });
});

export default router;
