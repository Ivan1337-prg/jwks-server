// extra coverage for db.js missed lines (empty table, bad inserts)
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { jest } from "@jest/globals";
import app, { appReady } from "../src/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_FILE = path.join(__dirname, "../totally_not_my_privateKeys.db");

beforeAll(async () => {
  await appReady;
});

// open db manually to test rows / edge cases
const openDb = async () =>
  open({ filename: DB_FILE, driver: sqlite3.Database });

describe("db.js additional branch coverage", () => {
  it("gracefully handles an empty keys table", async () => {
    const db = await openDb();
    await db.exec("DELETE FROM keys");
    const rows = await db.all("SELECT * FROM keys");
    expect(rows.length).toBe(0);
  });

  it("rejects invalid insert (NULL values)", async () => {
    const db = await openDb();
    let threw = false;
    try {
      await db.run("INSERT INTO keys(key, exp) VALUES(NULL, NULL)");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("has at least one key row after server init", async () => {
    const db = await openDb();
    const rows = await db.all("SELECT * FROM keys");
    expect(rows.length).toBeGreaterThanOrEqual(1);
    await db.close();
  });
});
