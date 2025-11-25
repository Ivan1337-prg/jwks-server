import crypto from "node:crypto";

let KEY = null;

function getKey() {
  if (KEY) return KEY;
  
  const KEY_B64 = process.env.NOT_MY_KEY;
  if (!KEY_B64) {
    throw new Error("NOT_MY_KEY environment variable is required");
  }

  KEY = Buffer.from(KEY_B64, "base64");
  if (KEY.length !== 32) {
    throw new Error("NOT_MY_KEY must be 32 bytes when base64-decoded (AES-256)");
  }
  return KEY;
}

export function encryptPrivateKey(pemText) {
  const iv = crypto.randomBytes(12); 
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);

  const ciphertext = Buffer.concat([
    cipher.update(pemText, "utf8"),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();
  return { encrypted: ciphertext, iv, tag };
}

export function decryptPrivateKey(encrypted, iv, tag) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return plaintext.toString("utf8");
}
