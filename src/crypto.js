// src/crypto.js
// AES-256-GCM helpers for encrypting/decrypting private keys.

import 'dotenv/config';
import crypto from 'node:crypto';

// --- load and validate key from .env ----------------------------------------

const KEY_B64 = process.env.NOT_MY_KEY;

if (!KEY_B64) {
  throw new Error('NOT_MY_KEY environment variable is required.');
}

const KEY = Buffer.from(KEY_B64, 'base64');
if (KEY.length !== 32) {
  throw new Error(
    `NOT_MY_KEY must be a base64-encoded 32-byte key (got ${KEY.length} bytes).`
  );
}

// --- encryption / decryption -------------------------------------------------

/**
 * Encrypt a private key (PEM string) with AES-256-GCM.
 * Returns { ciphertext, iv, tag } as Buffers.
 */
export function encryptPrivateKey(privateKeyPem) {
  // 12-byte IV is standard for GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);

  const ciphertext = Buffer.concat([
    cipher.update(privateKeyPem, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Return `encrypted` to match callers expecting that name
  return { encrypted: ciphertext, iv, tag };
}

/**
 * Decrypt a private key using AES-256-GCM.
 * All arguments must be Buffers from the DB.
 * Returns the original PEM string.
 */
export function decryptPrivateKey(ciphertext, iv, tag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}
