// tests/db.test.js
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = "test";

import { db, insertKey, getNewestValidKey, getExpiredKey, insertUser, getUserByUsername, insertAuthLog } from "../src/db.js";

describe("database schema and helpers", () => {
  test("keys table exists with expected columns", () => {
    const columns = db.prepare("PRAGMA table_info(keys)").all().reduce(
      (acc, col) => ({ ...acc, [col.name]: col.type }),
      {}
    );

    expect(columns.kid).toBeDefined();
    expect(columns.priv).toBeDefined();
    expect(columns.iv).toBeDefined();
    expect(columns.tag).toBeDefined();
    expect(columns.exp).toBeDefined();
    expect(columns.public_jwk).toBeDefined();
  });

  test("users table exists with expected columns", () => {
    const columns = db.prepare("PRAGMA table_info(users)").all().reduce(
      (acc, col) => ({ ...acc, [col.name]: col.type }),
      {}
    );

    expect(columns.id).toBeDefined();
    expect(columns.username).toBeDefined();
    expect(columns.email).toBeDefined();
    expect(columns.password_hash).toBeDefined();
  });

  test("auth_logs table exists", () => {
    const columns = db.prepare("PRAGMA table_info(auth_logs)").all().reduce(
      (acc, col) => ({ ...acc, [col.name]: col.type }),
      {}
    );

    expect(columns.id).toBeDefined();
    expect(columns.request_ip).toBeDefined();
    expect(columns.user_id).toBeDefined();
  });

  test("insertKey + getNewestValidKey work correctly", () => {
    db.prepare("DELETE FROM keys").run();
    const now = Math.floor(Date.now() / 1000);

    insertKey.run({
      kid: "valid-test",
      priv: Buffer.from("priv-data"),
      iv: Buffer.from("iv-data-12-byte"),
      tag: Buffer.from("tag-16-bytes-000"),
      exp: now + 3600,
      public_jwk: JSON.stringify({ kid: "valid-test" }),
    });

    const valid = getNewestValidKey.get();
    expect(valid).toBeTruthy();
    expect(valid.kid).toBe("valid-test");
  });

  test("getExpiredKey returns expired keys", () => {
    db.prepare("DELETE FROM keys").run();
    const now = Math.floor(Date.now() / 1000);

    insertKey.run({
      kid: "expired-test",
      priv: Buffer.from("priv-data"),
      iv: Buffer.from("iv-data-12-byte"),
      tag: Buffer.from("tag-16-bytes-000"),
      exp: now - 10,
      public_jwk: JSON.stringify({ kid: "expired-test" }),
    });

    const expired = getExpiredKey.get();
    expect(expired).toBeTruthy();
    expect(expired.kid).toBe("expired-test");
  });

  test("insertUser creates users", () => {
    db.prepare("DELETE FROM auth_logs").run();
    db.prepare("DELETE FROM users").run();
    insertUser.run({
      username: "testuser",
      email: "test@example.com",
      password_hash: "hashed-password",
    });

    const user = getUserByUsername.get("testuser");
    expect(user).toBeTruthy();
    expect(user.username).toBe("testuser");
    expect(user.email).toBe("test@example.com");
  });

  test("insertAuthLog creates audit logs", () => {
    db.prepare("DELETE FROM auth_logs").run();
    db.prepare("DELETE FROM users").run();
    
    insertUser.run({
      username: "loguser",
      email: "log@example.com",
      password_hash: "hashed",
    });
    const user = getUserByUsername.get("loguser");
    
    insertAuthLog.run({
      request_ip: "192.168.1.1",
      user_id: user.id,
    });

    const log = db.prepare("SELECT * FROM auth_logs WHERE request_ip = ?").get("192.168.1.1");
    expect(log).toBeTruthy();
    expect(log.request_ip).toBe("192.168.1.1");
  });

  test("getNewestValidKey returns null when no valid keys exist", () => {
    db.prepare("DELETE FROM keys").run();
    const result = getNewestValidKey.get();
    expect(result).toBeUndefined();
  });

  test("getExpiredKey returns null when no expired keys exist", () => {
    db.prepare("DELETE FROM keys").run();
    const now = Math.floor(Date.now() / 1000);
    insertKey.run({
      kid: "future-key",
      priv: Buffer.from("priv"),
      iv: Buffer.from("iv-data-12-byte"),
      tag: Buffer.from("tag-16-bytes-000"),
      exp: now + 3600,
      public_jwk: JSON.stringify({ kid: "future-key" }),
    });
    const result = getExpiredKey.get();
    expect(result).toBeUndefined();
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