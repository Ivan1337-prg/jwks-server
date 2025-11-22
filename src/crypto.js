// src/crypto.js
import crypto from "node:crypto";

const KEY_B64 = process.env.NOT_MY_KEY;
if (!KEY_B64) {
  throw new Error("NOT_MY_KEY environment variable is required");
}

const KEY = Buffer.from(KEY_B64, "base64");
if (KEY.length !== 32) {
  throw new Error("NOT_MY_KEY must be a base64-encoded 32-byte value");
}

const ALGO = "aes-256-gcm";
const IV_LEN = 12; // standard for GCM

export function encryptPrivateKey(plainText) {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return { priv: encrypted, iv, tag };
}

export function decryptPrivateKey(priv, iv, tag) {
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(priv), decipher.final()]);
  return decrypted.toString("utf8");
}
