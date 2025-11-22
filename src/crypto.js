// src/crypto.js
import crypto from "node:crypto";

const KEY_B64 = process.env.NOT_MY_KEY;
if (!KEY_B64) {
  throw new Error("NOT_MY_KEY environment variable is required");
}

const AES_KEY = Buffer.from(KEY_B64, "base64");
if (AES_KEY.length !== 32) {
  throw new Error("NOT_MY_KEY must be a 32-byte key encoded in base64");
}

// Encrypt a PEM private key with AES-256-GCM
export function encryptPrivateKey(pem) {
  const iv = crypto.randomBytes(12); // GCM IV
  const cipher = crypto.createCipheriv("aes-256-gcm", AES_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(pem, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { priv: ciphertext, iv, tag };
}

// Decrypt using the row returned from SQLite (BLOBs come back as Buffers)
export function decryptPrivateKey(row) {
  const { priv, iv, tag } = row;

  const decipher = crypto.createDecipheriv("aes-256-gcm", AES_KEY, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(priv), decipher.final()]);
  return plaintext.toString("utf8");
}
