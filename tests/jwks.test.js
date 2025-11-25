// tests/jwks.test.js
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = "test";

import request from "supertest";
import { initializeKeys } from "../src/keys.js";

let app;

beforeAll(async () => {
  const modServer = await import("../src/server.js");
  app = modServer.default || modServer.app || modServer;
  await initializeKeys();
});

describe("GET /.well-known/jwks.json", () => {
  test("returns JWKS with at least one key", async () => {
    const res = await request(app).get("/.well-known/jwks.json").expect(200);
    expect(res.body).toHaveProperty("keys");
    expect(Array.isArray(res.body.keys)).toBe(true);
    expect(res.body.keys.length).toBeGreaterThan(0);
  });

  test("returns RSA public keys only (no private parts)", async () => {
    const res = await request(app).get("/.well-known/jwks.json").expect(200);
    const { keys } = res.body;
    
    keys.forEach((jwk) => {
      expect(jwk.kty).toBe("RSA");
      expect(jwk.kid).toBeDefined();
      expect(jwk.alg).toBe("RS256");
      expect(jwk.use).toBe("sig");
      expect(jwk.n).toBeDefined();
      expect(jwk.e).toBeDefined();
      expect(jwk.d).toBeUndefined();
      expect(jwk.p).toBeUndefined();
      expect(jwk.q).toBeUndefined();
    });
  });

  test("returns Content-Type application/json", async () => {
    const res = await request(app).get("/.well-known/jwks.json").expect(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});
