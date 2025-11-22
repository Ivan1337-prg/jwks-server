import { insertKey, db } from '../src/db.js';

const info = insertKey.run({
  kid: 'test-kid',
  priv: Buffer.from('abc'),
  iv: Buffer.from('iviv'),
  tag: Buffer.from('tagg'),
  exp: 9999999999,
  public_jwk: '{}'
});
console.log('insert info:', info);

const row = db.prepare('SELECT * FROM keys WHERE kid = ?').get('test-kid');
console.log('row:', row);

process.exit(0);
