import { z } from 'zod';
import {
  decrypt,
  deriveKey,
  encrypt,
  kdfSchema,
  newKdf,
  envelopeSchema,
} from '../../infrastructure/crypto/crypto';
import {
  legacyDb as db,
  type LegacyDatabase as DeskDatabase,
} from '../../infrastructure/database/database';
import {
  newLegacyWorkspace,
  legacyWorkspaceSchema,
  type LegacyWorkspace,
} from '../tickets/model';

export { ConflictError } from '../../infrastructure/database/errors';
import { ConflictError } from '../../infrastructure/database/errors';
export class LockedError extends Error {
  constructor() {
    super('locked');
  }
}
const metadataSchema = z.object({
  id: z.literal('vault'),
  version: z.literal(1),
  kdf: kdfSchema,
  check: envelopeSchema,
});
export class VaultSession {
  #key?: CryptoKey;
  #epoch = 0;
  constructor(private database: DeskDatabase = db) {}
  lock() {
    this.#key = undefined;
    this.#epoch++;
  }
  async exists() {
    return (await this.database.vault.count()) > 0;
  }
  async create(password: string) {
    z.string().min(12).max(1024).parse(password);
    const epoch = this.#epoch;
    const kdf = newKdf();
    const key = await deriveKey(password, kdf);
    const check = await encrypt(key, 'service-desk-vault-v1', 'vault:1');
    const data = await encrypt(key, newLegacyWorkspace(), 'workspace:1:1');
    await this.database.transaction(
      'rw',
      this.database.vault,
      this.database.workspace,
      async () => {
        if (epoch !== this.#epoch) throw new LockedError();
        if (await this.database.vault.count()) throw new ConflictError();
        if (epoch !== this.#epoch) throw new LockedError();
        await this.database.vault.add({ id: 'vault', version: 1, kdf, check });
        await this.database.workspace.add({
          id: 'workspace',
          revision: 1,
          data,
        });
        if (epoch !== this.#epoch) throw new LockedError();
      },
    );
    if (epoch !== this.#epoch) throw new LockedError();
    this.#key = key;
  }
  async unlock(password: string) {
    z.string().max(1024).parse(password);
    this.lock();
    const epoch = this.#epoch;
    const metadata = metadataSchema.parse(
      await this.database.vault.get('vault'),
    );
    const key = await deriveKey(password, metadata.kdf);
    if (
      (await decrypt(key, metadata.check, 'vault:1')) !==
      'service-desk-vault-v1'
    )
      throw new Error('invalid-vault');
    if (epoch !== this.#epoch) throw new LockedError();
    this.#key = key;
  }
  async load(): Promise<{ value: LegacyWorkspace; revision: number }> {
    const key = this.#key;
    const epoch = this.#epoch;
    if (!key) throw new LockedError();
    const row = await this.database.workspace.get('workspace');
    if (!row || !Number.isSafeInteger(row.revision) || row.revision < 1)
      throw new Error('invalid-workspace');
    const value = legacyWorkspaceSchema.parse(
      await decrypt(key, row.data, `workspace:1:${row.revision}`),
    );
    if (epoch !== this.#epoch) throw new LockedError();
    return { value, revision: row.revision };
  }
  async save(
    value: LegacyWorkspace,
    expectedRevision: number,
  ): Promise<number> {
    const key = this.#key;
    const epoch = this.#epoch;
    if (!key) throw new LockedError();
    const revision = expectedRevision + 1;
    const data = await encrypt(
      key,
      legacyWorkspaceSchema.parse(value),
      `workspace:1:${revision}`,
    );
    await this.database.transaction('rw', this.database.workspace, async () => {
      if (epoch !== this.#epoch) throw new LockedError();
      const current = await this.database.workspace.get('workspace');
      if (current?.revision !== expectedRevision) throw new ConflictError();
      if (epoch !== this.#epoch) throw new LockedError();
      await this.database.workspace.put({ id: 'workspace', revision, data });
      if (epoch !== this.#epoch) throw new LockedError();
    });
    return revision;
  }
}
export const vaultSession = new VaultSession();
