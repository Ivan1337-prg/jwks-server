// tests/crypto.test.js
import { encryptPrivateKey, decryptPrivateKey } from "../src/crypto.js";

describe("crypto AES-GCM helpers", () => {
  test("encryptPrivateKey + decryptPrivateKey round-trip works", () => {
    const pem = "-----BEGIN PRIVATE KEY-----\nTEST-KEY\n-----END PRIVATE KEY-----";

    const { ciphertext, iv, tag } = encryptPrivateKey(pem);
    expect(ciphertext).toBeInstanceOf(Buffer);
    expect(iv).toBeInstanceOf(Buffer);
    expect(tag).toBeInstanceOf(Buffer);

    const decrypted = decryptPrivateKey({ priv: ciphertext, iv, tag });
    expect(decrypted).toBe(pem);
  });

  test("decryptPrivateKey throws if auth tag is wrong", () => {
    const pem = "another-test-key";
    const { ciphertext, iv, tag } = encryptPrivateKey(pem);

    // Flip one bit in the tag so GCM auth fails
    const badTag = Buffer.from(tag);
    badTag[0] ^= 0xff;

    expect(() =>
      decryptPrivateKey({ priv: ciphertext, iv, tag: badTag })
    ).toThrow();
  });
});
