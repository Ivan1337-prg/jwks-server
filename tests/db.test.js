// tests/db.test.js
import { db, insertKey, getNewestValidKey, getExpiredKey } from "../src/db.js";

describe("database schema and helpers", () => {
  test("keys table exists with expected columns", () => {
    const row = db
      .prepare("PRAGMA table_info(keys)")
      .all()
      .reduce(
        (acc, col) => ({ ...acc, [col.name]: col.type }),
        {}
      );

    expect(row.kid).toBeDefined();
    expect(row.priv).toBeDefined();
    expect(row.iv).toBeDefined();
    expect(row.tag).toBeDefined();
    expect(row.exp).toBeDefined();
    expect(row.public_jwk).toBeDefined();
  });

  test("insertKey + getNewestValidKey + getExpiredKey behave", () => {
    const now = Math.floor(Date.now() / 1000);

    // expired key
    insertKey.run({
      kid: "expired-test",
      priv: Buffer.from("1"),
      iv: Buffer.from("2"),
      tag: Buffer.from("3"),
      exp: now - 10,
      public_jwk: JSON.stringify({ kid: "expired-test" }),
    });

    // valid key
    insertKey.run({
      kid: "valid-test",
      priv: Buffer.from("4"),
      iv: Buffer.from("5"),
      tag: Buffer.from("6"),
      exp: now + 3600,
      public_jwk: JSON.stringify({ kid: "valid-test" }),
    });

    const valid = getNewestValidKey.get();
    expect(valid).toBeTruthy();
    expect(valid.kid).toBe("valid-test");

    const expired = getExpiredKey.get();
    expect(expired).toBeTruthy();
    expect(expired.kid).toBe("expired-test");
  });
});


/*
process.env.NOT_MY_KEY = "tMmgF117PlB08JPbqusAeEK20zZUet5VcNfQKU5bGIw=";
process.env.NODE_ENV = "test";

import { db } from "../src/db.js";

describe("DB schema", () => {
  test("tables exist", () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map(r => r.name);

    expect(tables).toEqual(
      expect.arrayContaining(["keys", "users", "auth_logs"])
    );
  });

  test("keys table has encrypted columns", () => {
    const pragma = db.prepare("PRAGMA table_info('keys')").all();
    const names = pragma.map(x => x.name);

    expect(names).toEqual(
      expect.arrayContaining(["priv", "iv", "tag", "exp", "public_jwk"])
    );
  });
});
*/