// src/keys.js
import crypto from "node:crypto";
import {
  generateKeyPair,
  exportJWK,
  exportPKCS8,
  importPKCS8,
  SignJWT
} from "jose";

import {
  db,
  insertKey,
  getNewestValidKey,
  getExpiredKey,
  getAllValidPublicJwks
} from "./db.js";
import { encryptPrivateKey, decryptPrivateKey } from "./crypto.js";

async function createAndStoreKeyPair(secondsFromNow) {
  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    modulusLength: 2048
  });

  const now = Math.floor(Date.now() / 1000);
  const exp = now + secondsFromNow;
  const kid = crypto.randomUUID();

  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = kid;
  publicJwk.use = "sig";
  publicJwk.alg = "RS256";

  const privPem = await exportPKCS8(privateKey);
  const { priv, iv, tag } = encryptPrivateKey(privPem);

  insertKey.run({
    kid,
    priv,
    iv,
    tag,
    exp,
    public_jwk: JSON.stringify(publicJwk)
  });
}

export async function initializeKeys() {
  const { c } = db.prepare("SELECT COUNT(*) AS c FROM keys").get();
  if (c > 0) return;

  // 1 hour valid key
  await createAndStoreKeyPair(60 * 60);

  // expired key (1 minute in the past)
  await createAndStoreKeyPair(-60);
}

function getKeyRow(expired) {
  return expired ? getExpiredKey.get() : getNewestValidKey.get();
}

export async function signJwt({ username = "userABC", expired = false } = {}) {
  const row = getKeyRow(expired);
  if (!row) {
    throw new Error("No signing key found in database");
  }

  const privPem = decryptPrivateKey(row.priv, row.iv, row.tag);
  const privateKey = await importPKCS8(privPem, "RS256");

  const now = Math.floor(Date.now() / 1000);
  const exp = expired ? now - 60 : now + 60 * 60;

  const token = await new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "RS256", kid: row.kid })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setIssuer("cs3550-project3")
    .setAudience("cs3550-clients")
    .sign(privateKey);

  return token;
}

export function getActivePublicJwks() {
  const rows = getAllValidPublicJwks.all();
  return rows.map((r) => JSON.parse(r.public_jwk));
}
