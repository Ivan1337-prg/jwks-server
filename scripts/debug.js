import { generateKeyPairSync } from 'node:crypto';
import { encryptPrivateKey } from '../src/crypto.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 1024,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
});

const res = encryptPrivateKey(privateKey);
console.log('encryptPrivateKey returned keys:', Object.keys(res));
console.log('encrypted is Buffer?', Buffer.isBuffer(res.encrypted));
console.log('encrypted length:', res.encrypted && res.encrypted.length);
console.log('iv is Buffer?', Buffer.isBuffer(res.iv));
console.log('tag is Buffer?', Buffer.isBuffer(res.tag));

process.exit(0);
