import crypto from "node:crypto";

const KEY_B64 = process.env.NOT_MY_KEY;
if (!KEY_B64) {
  throw new Error("NOT_MY_KEY environment variable is required");
}

const KEY = Buffer.from(KEY_B64, "base64");
if (KEY.length !== 32) {
  throw new Error("NOT_MY_KEY must be 32 bytes when base64-decoded (AES-256)");
}

export function encryptPrivateKey(pemText) {
  const iv = crypto.randomBytes(12); 
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

  const ciphertext = Buffer.concat([
    cipher.update(pemText, "utf8"),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();
  return { ciphertext, iv, tag };
}

export function decryptPrivateKey(row) {
  const { priv, iv, tag } = row;
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(priv),
    decipher.final()
  ]);

  return plaintext.toString("utf8");
}
