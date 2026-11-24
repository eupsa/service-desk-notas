import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DeskDatabase,
  LegacyDatabase,
} from '../../src/infrastructure/database/database';
import { LocalRepository } from '../../src/features/tickets/local-repository';
import {
  ConflictError,
  RecoveryWouldOverwriteError,
} from '../../src/infrastructure/database/errors';
import {
  deriveKey,
  encrypt,
  newKdf,
} from '../../src/infrastructure/crypto/crypto';
import { newLegacyWorkspace } from '../../src/features/tickets/model';

describe('passwordless local storage and legacy migration', () => {
  let database: DeskDatabase;
  let repository: LocalRepository;
  let legacyDatabase: LegacyDatabase;
  beforeEach(() => {
    database = new DeskDatabase('local-test-' + crypto.randomUUID());
    legacyDatabase = new LegacyDatabase('legacy-test-' + crypto.randomUUID());
    repository = new LocalRepository(database, legacyDatabase);
  });
  afterEach(async () => {
    await database.delete();
    await legacyDatabase.delete();
  });
  async function seedVersionOne() {
    const previous = new Dexie(legacyDatabase.name);
    previous.version(1).stores({ vault: '&id', workspace: '&id' });
    const kdf = newKdf();
    const key = await deriveKey('senha anterior de teste', kdf);
    const value = newLegacyWorkspace();
    value.ticket.summary = 'Registro anterior';
    value.ticket.collaborator = 'Nome e telefone originais';
    await previous.table('vault').put({
      id: 'vault',
      version: 1,
      kdf,
      check: await encrypt(key, 'service-desk-vault-v1', 'vault:1'),
    });
    await previous.table('workspace').put({
      id: 'workspace',
      revision: 1,
      data: await encrypt(key, value, 'workspace:1:1'),
    });
    previous.close();
  }
  it('opens directly and preserves encrypted fields after a database reopen', async () => {
    const current = await repository.load();
    current.value.ticket.summary = 'Acesso SAP';
    current.value.ticket.collaborator.name = 'Maria';
    current.value.ticket.collaborator.email = 'maria@empresa.test';
    await repository.save(current.value, current.revision);
    const storedKey = (await database.deviceKeys.get('device'))!.key;
    expect(storedKey.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('raw', storedKey)).rejects.toThrow();
    const raw = JSON.stringify(await database.localWorkspace.toArray());
    for (const secret of ['Acesso SAP', 'Maria', 'maria@empresa.test'])
      expect(raw).not.toContain(secret);
    database.close();
    await database.open();
    expect(
      (await new LocalRepository(database, legacyDatabase).load()).value,
    ).toEqual(current.value);
  });
  it('creates only one key/workspace when two windows open together', async () => {
    const [a, b] = await Promise.all([
      repository.load(),
      new LocalRepository(database, legacyDatabase).load(),
    ]);
    expect(a).toEqual(b);
    expect(await database.deviceKeys.count()).toBe(1);
    expect(await database.localWorkspace.count()).toBe(1);
  });
  it('rejects stale writes without losing the newer ticket', async () => {
    const a = await repository.load();
    const b = await repository.load();
    a.value.ticket.summary = 'Novo';
    await repository.save(a.value, a.revision);
    b.value.ticket.summary = 'Atrasado';
    await expect(repository.save(b.value, b.revision)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect((await repository.load()).value.ticket.summary).toBe('Novo');
  });
  it('upgrades a real v1 database, recovers once and preserves the original ciphertext', async () => {
    await seedVersionOne();
    await repository.load();
    const original = await legacyDatabase.workspace.get('workspace');
    const metadata = await legacyDatabase.vault.get('vault');
    await repository.recoverLegacy('senha anterior de teste');
    const recovered = await repository.load();
    expect(recovered.value.ticket.summary).toBe('Registro anterior');
    expect(recovered.value.ticket.collaborator.notes).toBe(
      'Nome e telefone originais',
    );
    expect(recovered.value.settings).not.toHaveProperty('autoLockMinutes');
    expect(await legacyDatabase.workspace.get('workspace')).toEqual(original);
    expect(await legacyDatabase.vault.get('vault')).toEqual(metadata);
    expect((await database.deviceKeys.get('device'))!.legacyImported).toBe(
      true,
    );
    await expect(
      repository.recoverLegacy('senha anterior de teste'),
    ).rejects.toBeInstanceOf(RecoveryWouldOverwriteError);
  });
  it('does not mutate either record when the old password is wrong', async () => {
    await seedVersionOne();
    const original = await repository.load();
    await expect(repository.recoverLegacy('senha errada')).rejects.toThrow();
    expect(await repository.load()).toEqual(original);
    expect((await database.deviceKeys.get('device'))!.legacyImported).toBe(
      false,
    );
    expect(await legacyDatabase.vault.count()).toBe(1);
  });
  it('refuses recovery over an existing new ticket', async () => {
    await seedVersionOne();
    const current = await repository.load();
    current.value.ticket.collaborator.name = 'Novo colaborador';
    await repository.save(current.value, current.revision);
    await expect(
      repository.recoverLegacy('senha anterior de teste'),
    ).rejects.toBeInstanceOf(RecoveryWouldOverwriteError);
    expect((await repository.load()).value.ticket.collaborator.name).toBe(
      'Novo colaborador',
    );
  });
  it('fails closed on missing keys or corrupt ciphertext instead of resetting data', async () => {
    await repository.load();
    const row = (await database.localWorkspace.get('workspace'))!;
    row.data.ciphertext[0] = row.data.ciphertext[0]! ^ 1;
    await database.localWorkspace.put(row);
    await expect(repository.load()).rejects.toThrow();
    expect(await database.localWorkspace.get('workspace')).toEqual(row);
    await database.deviceKeys.delete('device');
    await expect(repository.load()).rejects.toThrow('incomplete-local-storage');
    expect(await database.localWorkspace.get('workspace')).toEqual(row);
  });
  it('opens earlier structured records without a location field without losing other data', async () => {
    const current = await repository.load();
    current.value.ticket.collaborator.name = 'Maria';
    const withoutLocation = structuredClone(current.value);
    Reflect.deleteProperty(withoutLocation.ticket.collaborator, 'location');
    const key = (await database.deviceKeys.get('device'))!.key;
    await database.localWorkspace.put({
      id: 'workspace',
      revision: 1,
      data: await encrypt(key, withoutLocation, 'local-workspace:2:1'),
    });
    const loaded = await repository.load();
    expect(loaded.value.ticket.collaborator.name).toBe('Maria');
    expect(loaded.value.ticket.collaborator.location).toBe('');
  });
});
