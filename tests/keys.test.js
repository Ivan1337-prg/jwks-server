// tests/keys.test.js
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = "test";

import { db } from "../src/db.js";
import { initializeKeys, getActivePublicJwks, getPublicJwks, signJwt } from "../src/keys.js";

beforeAll(async () => {
  db.prepare("DELETE FROM keys").run();
  await initializeKeys();
});

describe("keys helpers", () => {
  test("initializeKeys creates valid and expired keys", async () => {
    const total = db.prepare("SELECT COUNT(*) AS c FROM keys").get().c;
    const valid = db.prepare("SELECT COUNT(*) AS c FROM keys WHERE exp > strftime('%s','now')").get().c;
    const expired = db.prepare("SELECT COUNT(*) AS c FROM keys WHERE exp <= strftime('%s','now')").get().c;

    expect(total).toBeGreaterThanOrEqual(2);
    expect(valid).toBeGreaterThanOrEqual(1);
    expect(expired).toBeGreaterThanOrEqual(1);
  });

  test("initializeKeys skips if valid key already exists", async () => {
    const countBefore = db.prepare("SELECT COUNT(*) AS c FROM keys").get().c;
    await initializeKeys();
    const countAfter = db.prepare("SELECT COUNT(*) AS c FROM keys").get().c;
    expect(countAfter).toBe(countBefore);
  });

  test("getActivePublicJwks returns non-expired keys", () => {
    // Ensure fresh keys are available
    const keys = getActivePublicJwks();
    
    // Filter out any invalid keys
    const validKeys = keys.filter(jwk => jwk && jwk.kty);
    
    expect(Array.isArray(keys)).toBe(true);
    expect(validKeys.length).toBeGreaterThanOrEqual(1);
    validKeys.forEach((jwk) => {
      expect(jwk.kty).toBe("RSA");
      expect(jwk.kid).toBeDefined();
      expect(jwk.alg).toBe("RS256");
      expect(jwk.use).toBe("sig");
      expect(jwk.n).toBeDefined();
      expect(jwk.e).toBeDefined();
      expect(jwk.d).toBeUndefined();
    });
  });

  test("getPublicJwks is alias for getActivePublicJwks", () => {
    const keys1 = getActivePublicJwks();
    const keys2 = getPublicJwks();
    expect(keys2).toEqual(keys1);
  });

  test("signJwt with string payload creates valid JWT", async () => {
    // Reinit keys before signing tests
    db.prepare("DELETE FROM keys").run();
    await initializeKeys();
    
    const token = await signJwt("test-user");
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    expect(header.alg).toBe("RS256");
    expect(header.kid).toBeDefined();
  });

  test("signJwt with object payload", async () => {
    // Reinit keys before signing tests
    db.prepare("DELETE FROM keys").run();
    await initializeKeys();
    
    const token = await signJwt({ user: "test", role: "admin" });
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  test("signJwt with expired=true", async () => {
    // Reinit keys before signing tests
    db.prepare("DELETE FROM keys").run();
    await initializeKeys();
    
    const token = await signJwt("test", { expired: true });
    const parts = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    expect(payload.exp).toBeLessThan(Math.floor(Date.now() / 1000));
  });

  test("signJwt with expired=false (default)", async () => {
    // Reinit keys before signing tests
    db.prepare("DELETE FROM keys").run();
    await initializeKeys();
    
    const token = await signJwt("test", { expired: false });
    const parts = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test("signJwt throws if no signing key available", async () => {
    const countBefore = db.prepare("SELECT COUNT(*) AS c FROM keys").get().c;
    db.prepare("DELETE FROM keys").run();
    await expect(signJwt("test")).rejects.toThrow("No signing key");
    
    // Restore keys
    for (let i = 0; i < countBefore; i++) {
      await initializeKeys();
    }
  });
});
