// tests/crypto.test.js
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = "test";

import { encryptPrivateKey, decryptPrivateKey } from "../src/crypto.js";

describe("crypto AES-GCM helpers", () => {
  test("encryptPrivateKey returns encrypted, iv, and tag", () => {
    const pem = "-----BEGIN PRIVATE KEY-----\nTEST-KEY\n-----END PRIVATE KEY-----";

    const { encrypted, iv, tag } = encryptPrivateKey(pem);
    expect(encrypted).toBeInstanceOf(Buffer);
    expect(iv).toBeInstanceOf(Buffer);
    expect(tag).toBeInstanceOf(Buffer);
    expect(iv.length).toBe(12);
    expect(encrypted.length).toBeGreaterThan(0);
    expect(tag.length).toBe(16);
  });

  test("decryptPrivateKey round-trip works", () => {
    const pem = "-----BEGIN PRIVATE KEY-----\nTEST-KEY\n-----END PRIVATE KEY-----";

    const { encrypted, iv, tag } = encryptPrivateKey(pem);
    const decrypted = decryptPrivateKey(encrypted, iv, tag);
    expect(decrypted).toBe(pem);
  });

  test("decryptPrivateKey throws if auth tag is corrupted", () => {
    const pem = "another-test-key";
    const { encrypted, iv, tag } = encryptPrivateKey(pem);

    const badTag = Buffer.from(tag);
    badTag[0] ^= 0xff;

    expect(() =>
      decryptPrivateKey(encrypted, iv, badTag)
    ).toThrow();
  });

  test("decryptPrivateKey throws if IV is wrong", () => {
    const pem = "test-key-data";
    const { encrypted, iv, tag } = encryptPrivateKey(pem);

    const badIv = Buffer.alloc(12);
    badIv.fill(0xff);

    expect(() =>
      decryptPrivateKey(encrypted, badIv, tag)
    ).toThrow();
  });

  test("encryptPrivateKey with unicode text round-trips", () => {
    const pem = "Key with unicode: \u00e9\u00e0\u00fc";
    const { encrypted, iv, tag } = encryptPrivateKey(pem);
    const decrypted = decryptPrivateKey(encrypted, iv, tag);
    expect(decrypted).toBe(pem);
  });
});
