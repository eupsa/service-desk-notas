import { beforeAll, describe, expect, it } from 'vitest';
import {
  decrypt,
  deriveKey,
  encrypt,
  newKdf,
} from '../../src/infrastructure/crypto/crypto';

describe('Web Crypto vault primitives', () => {
  let key: CryptoKey;
  const kdf = newKdf();
  beforeAll(async () => {
    key = await deriveKey('uma senha longa e forte', kdf);
  });
  it('derives a non-exportable AES-256 key reproducibly', async () => {
    expect(key.extractable).toBe(false);
    expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    const same = await deriveKey('uma senha longa e forte', kdf);
    const envelope = await encrypt(
      key,
      { secret: 'Nome corporativo' },
      'record:1',
    );
    expect(await decrypt(same, envelope, 'record:1')).toEqual({
      secret: 'Nome corporativo',
    });
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow();
  });
  it('uses independent salts and a new 96-bit IV for every encryption', async () => {
    expect(newKdf().salt).not.toEqual(kdf.salt);
    const a = await encrypt(key, 'sensitive', 'record:1');
    const b = await encrypt(key, 'sensitive', 'record:1');
    expect(a.iv).toHaveLength(12);
    expect(a.iv).not.toEqual(b.iv);
    expect(a.ciphertext).not.toEqual(b.ciphertext);
  });
  it('rejects wrong passwords, modified ciphertext, IVs and swapped contexts', async () => {
    const data = await encrypt(key, 'secret', 'record:1');
    const wrong = await deriveKey('senha incorreta muito longa', kdf);
    await expect(decrypt(wrong, data, 'record:1')).rejects.toThrow();
    await expect(decrypt(key, data, 'record:2')).rejects.toThrow();
    const ciphertext = data.ciphertext.slice();
    ciphertext[0] = ciphertext[0]! ^ 1;
    await expect(
      decrypt(key, { ...data, ciphertext }, 'record:1'),
    ).rejects.toThrow();
    const iv = data.iv.slice();
    iv[0] = iv[0]! ^ 1;
    await expect(decrypt(key, { ...data, iv }, 'record:1')).rejects.toThrow();
  });
  it('rejects unsupported KDF metadata and envelope versions', async () => {
    await expect(
      deriveKey('password', { ...kdf, iterations: 1 } as never),
    ).rejects.toThrow();
    await expect(
      decrypt(
        key,
        {
          version: 2,
          iv: new Uint8Array(12),
          ciphertext: new Uint8Array(16),
        } as never,
        'x',
      ),
    ).rejects.toThrow();
  });
});
