import { z } from 'zod';

export const ITERATIONS = 600_000;
const bytes = (length?: number) =>
  z
    .instanceof(Uint8Array)
    .refine((v) =>
      length === undefined
        ? v.length >= 16 && v.length <= 10_000_000
        : v.length === length,
    );
export const envelopeSchema = z.object({
  version: z.literal(1),
  iv: bytes(12),
  ciphertext: bytes(),
});
export type Envelope = z.infer<typeof envelopeSchema>;
export const kdfSchema = z.object({
  name: z.literal('PBKDF2'),
  hash: z.literal('SHA-256'),
  iterations: z.literal(ITERATIONS),
  salt: bytes(16),
});
export type Kdf = z.infer<typeof kdfSchema>;
const encoder = new TextEncoder();

export function newKdf(): Kdf {
  return {
    name: 'PBKDF2',
    hash: 'SHA-256',
    iterations: ITERATIONS,
    salt: crypto.getRandomValues(new Uint8Array(16)),
  };
}

export async function deriveKey(
  password: string,
  metadata: Kdf,
): Promise<CryptoKey> {
  const kdf = kdfSchema.parse(metadata);
  const raw = encoder.encode(password);
  try {
    const material = await crypto.subtle.importKey(
      'raw',
      raw,
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    return await crypto.subtle.deriveKey(
      {
        name: kdf.name,
        hash: kdf.hash,
        salt: new Uint8Array(kdf.salt),
        iterations: kdf.iterations,
      },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  } finally {
    raw.fill(0);
  }
}

export async function encrypt(
  key: CryptoKey,
  value: unknown,
  context: string,
): Promise<Envelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const raw = encoder.encode(JSON.stringify(value));
  try {
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: encoder.encode(context),
        tagLength: 128,
      },
      key,
      raw,
    );
    return { version: 1, iv, ciphertext: new Uint8Array(ciphertext) };
  } finally {
    raw.fill(0);
  }
}

export async function decrypt(
  key: CryptoKey,
  data: Envelope,
  context: string,
): Promise<unknown> {
  const envelope = envelopeSchema.parse(data);
  const raw = new Uint8Array(
    await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(envelope.iv),
        additionalData: encoder.encode(context),
        tagLength: 128,
      },
      key,
      new Uint8Array(envelope.ciphertext),
    ),
  );
  try {
    return JSON.parse(new TextDecoder().decode(raw));
  } finally {
    raw.fill(0);
  }
}
