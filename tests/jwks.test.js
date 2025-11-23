// tests/jwks.test.js
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = "test";

import request from "supertest";

let app;
let initializeKeys;

beforeAll(async () => {
  const modServer = await import("../src/server.js");
  app = modServer.default || modServer.app || modServer;

  const modKeys = await import("../src/keys.js");
  initializeKeys = modKeys.initializeKeys;
  await initializeKeys();
});

describe("GET /.well-known/jwks.json", () => {
  test("returns JWKS with at least one key", async () => {
    const res = await request(app).get("/.well-known/jwks.json");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("keys");
    expect(Array.isArray(res.body.keys)).toBe(true);
    expect(res.body.keys.length).toBeGreaterThan(0);
    res.body.keys.forEach((k) => {
      expect(k).toHaveProperty("kid");
      expect(k).toHaveProperty("kty");
    });
  });
});
