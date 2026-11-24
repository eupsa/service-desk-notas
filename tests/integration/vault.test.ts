import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LegacyDatabase as DeskDatabase } from '../../src/infrastructure/database/database';
import {
  ConflictError,
  LockedError,
  VaultSession,
} from '../../src/features/vault/session';

describe('encrypted IndexedDB persistence', () => {
  let database: DeskDatabase;
  let session: VaultSession;
  const password = 'uma senha segura de teste';
  beforeEach(() => {
    database = new DeskDatabase(`test-${crypto.randomUUID()}`);
    session = new VaultSession(database);
  });
  afterEach(async () => {
    session.lock();
    await database.delete();
  });
  it('persists sensitive fields only as ciphertext and recovers after restart', async () => {
    await session.create(password);
    const loaded = await session.load();
    loaded.value.ticket = {
      number: 'INC0000012345678',
      kba: 'KBA1000013',
      summary: 'Acesso SAP',
      description: 'Descrição sigilosa',
      troubleshooting: 'Procedimento sigiloso',
      collaborator: 'Maria maria@empresa.test',
    };
    await session.save(loaded.value, loaded.revision);
    const raw = JSON.stringify({
      vault: await database.vault.toArray(),
      workspace: await database.workspace.toArray(),
    });
    for (const secret of [...Object.values(loaded.value.ticket), password])
      expect(raw).not.toContain(secret);
    session.lock();
    await expect(session.load()).rejects.toBeInstanceOf(LockedError);
    const restarted = new VaultSession(database);
    await expect(restarted.load()).rejects.toBeInstanceOf(LockedError);
    await expect(restarted.unlock('senha errada longa')).rejects.toThrow();
    await restarted.unlock(password);
    expect((await restarted.load()).value).toEqual(loaded.value);
    restarted.lock();
  });
  it('prevents stale windows from overwriting newer edits', async () => {
    await session.create(password);
    const other = new VaultSession(database);
    await other.unlock(password);
    const a = await session.load();
    const b = await other.load();
    a.value.ticket.summary = 'Primeira janela';
    await session.save(a.value, a.revision);
    b.value.ticket.summary = 'Janela atrasada';
    await expect(other.save(b.value, b.revision)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect((await other.load()).value.ticket.summary).toBe('Primeira janela');
    other.lock();
  });
  it('rejects duplicate setup atomically and keeps the original vault', async () => {
    await session.create(password);
    const other = new VaultSession(database);
    await expect(
      other.create('outra senha muito longa'),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(await database.vault.count()).toBe(1);
    expect(await database.workspace.count()).toBe(1);
    await session.unlock(password);
    expect((await session.load()).revision).toBe(1);
  });
  it('cancels an unlock or write when locked during cryptographic work', async () => {
    await session.create(password);
    const loaded = await session.load();
    const saving = session.save(loaded.value, loaded.revision);
    session.lock();
    await expect(saving).rejects.toBeInstanceOf(LockedError);
    const unlocking = session.unlock(password);
    session.lock();
    await expect(unlocking).rejects.toBeInstanceOf(LockedError);
    await expect(session.load()).rejects.toBeInstanceOf(LockedError);
  });
  it('fails closed on corrupted encrypted data', async () => {
    await session.create(password);
    const row = (await database.workspace.get('workspace'))!;
    row.data.ciphertext[0] = row.data.ciphertext[0]! ^ 1;
    await database.workspace.put(row);
    await expect(session.load()).rejects.toThrow();
    expect(await database.workspace.count()).toBe(1);
  });
});
