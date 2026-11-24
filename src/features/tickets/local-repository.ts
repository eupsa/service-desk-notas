import {
  db,
  legacyDb,
  type LegacyDatabase,
  type DeskDatabase,
} from '../../infrastructure/database/database';
import { decrypt, encrypt } from '../../infrastructure/crypto/crypto';
import {
  ConflictError,
  RecoveryWouldOverwriteError,
} from '../../infrastructure/database/errors';
import { VaultSession } from '../vault/session';
import {
  isEmptyTicket,
  migrateLegacy,
  newWorkspace,
  workspaceSchema,
  type Workspace,
} from './model';

export class LocalRepository {
  constructor(
    private database: DeskDatabase = db,
    private legacyDatabase: LegacyDatabase = legacyDb,
  ) {}
  private async initialize() {
    const [existingKey, existingData] = await this.database.transaction(
      'r',
      this.database.deviceKeys,
      this.database.localWorkspace,
      () =>
        Promise.all([
          this.database.deviceKeys.get('device'),
          this.database.localWorkspace.get('workspace'),
        ]),
    );
    if (existingKey && existingData) return;
    if (existingKey || existingData)
      throw new Error('incomplete-local-storage');
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    const data = await encrypt(key, newWorkspace(), 'local-workspace:2:1');
    await this.database.transaction(
      'rw',
      this.database.deviceKeys,
      this.database.localWorkspace,
      async () => {
        const storedKey = await this.database.deviceKeys.get('device');
        const storedData = await this.database.localWorkspace.get('workspace');
        if (storedKey && storedData) return;
        if (storedKey || storedData)
          throw new Error('incomplete-local-storage');
        await this.database.deviceKeys.add({
          id: 'device',
          key,
          legacyImported: false,
        });
        await this.database.localWorkspace.add({
          id: 'workspace',
          revision: 1,
          data,
        });
      },
    );
  }
  private async key() {
    const stored = await this.database.deviceKeys.get('device');
    if (
      !stored ||
      stored.key.extractable ||
      stored.key.type !== 'secret' ||
      stored.key.algorithm.name !== 'AES-GCM' ||
      !stored.key.usages.includes('encrypt') ||
      !stored.key.usages.includes('decrypt')
    )
      throw new Error('invalid-device-key');
    return stored.key;
  }
  async load(): Promise<{ value: Workspace; revision: number }> {
    await this.initialize();
    const key = await this.key();
    const row = await this.database.localWorkspace.get('workspace');
    if (!row || !Number.isSafeInteger(row.revision) || row.revision < 1)
      throw new Error('invalid-workspace');
    const value = workspaceSchema.parse(
      await decrypt(key, row.data, `local-workspace:2:${row.revision}`),
    );
    return { value, revision: row.revision };
  }
  async save(
    value: Workspace,
    expectedRevision: number,
    importingLegacy = false,
  ): Promise<number> {
    const key = await this.key();
    const revision = expectedRevision + 1;
    const data = await encrypt(
      key,
      workspaceSchema.parse(value),
      `local-workspace:2:${revision}`,
    );
    await this.database.transaction(
      'rw',
      this.database.localWorkspace,
      this.database.deviceKeys,
      async () => {
        const current = await this.database.localWorkspace.get('workspace');
        if (current?.revision !== expectedRevision) throw new ConflictError();
        await this.database.localWorkspace.put({
          id: 'workspace',
          revision,
          data,
        });
        if (importingLegacy)
          await this.database.deviceKeys.update('device', {
            legacyImported: true,
          });
      },
    );
    return revision;
  }
  async recoverLegacy(password: string) {
    const legacy = new VaultSession(this.legacyDatabase);
    try {
      await legacy.unlock(password);
      const old = await legacy.load();
      const current = await this.load();
      if (!isEmptyTicket(current.value.ticket))
        throw new RecoveryWouldOverwriteError();
      await this.save(migrateLegacy(old.value), current.revision, true);
    } finally {
      legacy.lock();
    }
  }
}
export const localRepository = new LocalRepository();
