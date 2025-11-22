// src/server.js
import "dotenv/config"; // loads .env if present

import express from "express";
import jwksRoutes from "./routes/jwks.js";
import authRoutes from "./routes/auth.js";
import registerRoutes from "./routes/register.js";
import { initializeKeys } from "./keys.js";

const app = express();
app.use(express.json());

app.use(jwksRoutes);
app.use(authRoutes);
app.use(registerRoutes);

app.get("/", (req, res) => {
  res.status(200).send("JWKS Server running");
});

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

const PORT = process.env.PORT || 8080;

initializeKeys().then(() => {
  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
      console.log(`http://localhost:${PORT}`);
    });
  }
});

export default app;
