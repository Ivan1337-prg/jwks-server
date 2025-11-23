// tests/keys.test.js
import { db } from "../src/db.js";
import { initializeKeys, getActivePublicJwks, signJwt } from "../src/keys.js";

beforeAll(() => {
  // Start from a clean keys table for deterministic tests
  db.prepare("DELETE FROM keys").run();
});

describe("keys helpers", () => {
  test("initializeKeys creates at least one valid and one expired key", async () => {
    await initializeKeys();

    const total = db
      .prepare("SELECT COUNT(*) AS c FROM keys")
      .get().c;

    const valid = db
      .prepare(
        "SELECT COUNT(*) AS c FROM keys WHERE exp > strftime('%s','now')"
      )
      .get().c;

    const expired = db
      .prepare(
        "SELECT COUNT(*) AS c FROM keys WHERE exp <= strftime('%s','now')"
      )
      .get().c;

    expect(total).toBeGreaterThanOrEqual(2);
    expect(valid).toBeGreaterThanOrEqual(1);
    expect(expired).toBeGreaterThanOrEqual(1);
  });

  test("getActivePublicJwks returns parsed JWK objects for non-expired keys", () => {
    const keys = getActivePublicJwks();

    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBeGreaterThanOrEqual(1);

    for (const jwk of keys) {
      expect(jwk).toHaveProperty("kty");
      expect(jwk).toHaveProperty("kid");
      expect(jwk).toHaveProperty("alg");
      expect(jwk).toHaveProperty("use");
    }
  });

  test("signJwt returns a well-formed JWT string", async () => {
    const token = await signJwt("test-user", { expired: false });

    expect(typeof token).toBe("string");
    // Very lightweight check: header.payload.signature
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBeGreaterThan(0);
  });

  test("signJwt can also issue an 'expired' token (different branch)", async () => {
    const token = await signJwt("test-user", { expired: true });

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });
});
