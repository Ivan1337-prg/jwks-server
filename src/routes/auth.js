import { decryptPrivateKey } from '../crypto.js';
import express from 'express';
import { SignJWT } from 'jose';
import { getNewestValidKey, getExpiredKey, getUserByUsername, insertAuthLog } from '../db.js';
import { createPrivateKey } from 'node:crypto';


const r = express.Router();

/**
 * POST /auth
 * Basic auth: username / password
 * Query: ?expired=true → use expired key
 */
r.post('/auth', async (req, res) => {
    const useExpired = req.query.expired === "true";

    // ---- mock auth (per project instructions) ----
    const authHeader = req.headers.authorization || "";
    const encoded = authHeader.replace("Basic ", "");
    const [username] = Buffer.from(encoded, "base64").toString().split(":");

    let user = null;
    try {
        user = getUserByUsername.get(username);
    } catch (e) {}

    // ---- select key ----
    const keyRow = useExpired ? getExpiredKey.get() : getNewestValidKey.get();
    if (!keyRow) return res.status(500).json({ error: "no keys in database" });

    // decrypt RSA private key
    const privPem = decryptPrivateKey(
        keyRow.priv,
        keyRow.iv,
        keyRow.tag
    );

    // sign JWT
    const jwt = await new SignJWT({ user })
        .setProtectedHeader({ alg: "RS256", kid: keyRow.kid })
        .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
        .sign(await importPrivateKey(privPem));

    // log request (user_id may be null)
    insertAuthLog.run({
        request_ip: req.ip,
        user_id: user?.id ?? null
    });

    return res.json({ token: jwt });
});

async function importPrivateKey(pem) {
    return createPrivateKey({ key: pem, format: "pem" }).export({
        format: "jwk"
    });
}

export default r;
