import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { generateKeyPair, exportJWK, importJWK, SignJWT } from "jose";
import {
  insertKey,
  getNewestValidKey,
  getExpiredKey,
  getAllValidPublicJwks,
} from "./db.js";

const NOT_MY_KEY_B64 = process.env.NOT_MY_KEY;

if (!NOT_MY_KEY_B64) {
  throw new Error("NOT_MY_KEY environment variable is required");
}

const AES_KEY = Buffer.from(NOT_MY_KEY_B64, "base64");
if (AES_KEY.length !== 32) {
  throw new Error("NOT_MY_KEY must be a 32-byte base64 string (AES-256 key)");
}

function encryptPrivateJwk(jwk) {
  const iv = randomBytes(12); 
  const cipher = createCipheriv("aes-256-gcm", AES_KEY, iv);

  const plaintext = Buffer.from(JSON.stringify(jwk), "utf8");
  const cipherText = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { priv: cipherText, iv, tag };
}

function decryptPrivateJwk(row) {
  const decipher = createDecipheriv("aes-256-gcm", AES_KEY, row.iv);
  decipher.setAuthTag(row.tag);

  const plain = Buffer.concat([decipher.update(row.priv), decipher.final()]);
  return JSON.parse(plain.toString("utf8"));
}

async function createAndStoreKey(expSeconds) {
  const { privateKey, publicKey } = await generateKeyPair("RS256");

  const privJwk = await exportJWK(privateKey);
  const pubJwk = await exportJWK(publicKey);

  const kid = pubJwk.kid || randomBytes(8).toString("hex");
  pubJwk.kid = kid;

  const { priv, iv, tag } = encryptPrivateJwk(privJwk);

  insertKey.run({
    kid,
    priv,
    iv,
    tag,
    exp: expSeconds,
    public_jwk: JSON.stringify(pubJwk),
  });

  return kid;
}

export async function initializeKeys() {
  const existing = getNewestValidKey.get();
  if (existing) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);

  await createAndStoreKey(now + 60 * 60);

  await createAndStoreKey(now - 60 * 60);
}

export function getActivePublicJwks() {
  const rows = getAllValidPublicJwks.all();
  return rows.map((r) => JSON.parse(r.public_jwk));
}

export const getPublicJwks = getActivePublicJwks;

async function getSigningKey(expired = false) {
  const row = expired ? getExpiredKey.get() : getNewestValidKey.get();
  if (!row) {
    throw new Error("No signing key in database");
  }

  const privJwk = decryptPrivateJwk(row);
  const key = await importJWK(privJwk, "RS256");
  const publicJwk = JSON.parse(row.public_jwk);

  return { key, kid: publicJwk.kid };
}

export async function signJwt(payloadOrUsername = {}, options = {}) {
  const expired = options.expired === true;

  const payload =
    typeof payloadOrUsername === "string"
      ? { sub: payloadOrUsername }
      : payloadOrUsername || {};

  const { key, kid } = await getSigningKey(expired);
  const now = Math.floor(Date.now() / 1000);
  const exp = expired ? now - 60 : now + 60;

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(key);

  return token;
}
