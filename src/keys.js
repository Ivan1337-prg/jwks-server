// src/keys.js
import { randomUUID } from "node:crypto";
import {
  generateKeyPair,
  exportJWK,
  exportPKCS8,
  importPKCS8,
  SignJWT
} from "jose";
import { encryptPrivateKey, decryptPrivateKey } from "./crypto.js";
import {
  insertKey,
  getNewestValidKey,
  getExpiredKey,
  getAllValidPublicJwks
} from "./db.js";

const ALG = "RS256";

async function createAndStoreKey(expiresInSeconds) {
  const { publicKey, privateKey } = await generateKeyPair(ALG);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;

  const kid = randomUUID();

  const jwk = await exportJWK(publicKey);
  jwk.kid = kid;
  jwk.use = "sig";
  jwk.alg = ALG;

  const pkcs8 = await exportPKCS8(privateKey);
  const { priv, iv, tag } = encryptPrivateKey(pkcs8);

  insertKey.run({
    kid,
    priv,
    iv,
    tag,
    exp,
    public_jwk: JSON.stringify(jwk)
  });
}

export async function initializeKeys() {
  const valid = getNewestValidKey.get();
  const expired = getExpiredKey.get();

  // one valid key ~1 hour in the future
  if (!valid) {
    await createAndStoreKey(60 * 60);
  }

  // one expired key (expired 1 minute ago)
  if (!expired) {
    await createAndStoreKey(-60);
  }
}

export function getActivePublicJwks() {
  return getAllValidPublicJwks.all().map((row) => JSON.parse(row.public_jwk));
}

export async function signJwtFromDb({ expired = false, username = "userABC" }) {
  const row = expired ? getExpiredKey.get() : getNewestValidKey.get();
  if (!row) {
    throw new Error("No signing key found in database");
  }

  const pkcs8 = decryptPrivateKey(row);
  const privateKey = await importPKCS8(pkcs8, ALG);

  const now = Math.floor(Date.now() / 1000);
  const exp = expired ? now - 60 : now + 60 * 15;

  const token = await new SignJWT({ sub: username })
    .setProtectedHeader({ alg: ALG, kid: row.kid })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(privateKey);

  return token;
}
