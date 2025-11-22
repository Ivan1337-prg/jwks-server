import { generateKeyPairSync, createPublicKey } from 'node:crypto';
import { insertKey } from '../src/db.js';
import { encryptPrivateKey } from '../src/crypto.js';

function generateAndStoreKey(kid, exp) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  });

  const { encrypted, iv, tag } = encryptPrivateKey(privateKey);
  console.log('kid', kid, 'encrypted?', !!encrypted, 'len', encrypted && encrypted.length);

  const public_jwk = JSON.stringify({
    kty: 'RSA',
    kid,
    alg: 'RS256',
    use: 'sig',
    ...(() => { const der = Buffer.from(publicKey.replace(/-----[^]+?-----/g, '').replace(/\s+/g, ''), 'base64'); const keyObj = createPublicKey({ key: der, format: 'der', type: 'spki' }); return keyObj.export({ format: 'jwk' }); })()
  });

  const info = insertKey.run({ kid, priv: encrypted, iv, tag, exp, public_jwk });
  console.log('insert info', info);
}

generateAndStoreKey('debug-valid', Math.floor(Date.now()/1000) + 3600);
console.log('done');
process.exit(0);
