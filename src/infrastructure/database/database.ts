import Dexie, { type EntityTable } from 'dexie';
import type { Envelope, Kdf } from '../crypto/crypto';

export interface VaultRow {
  id: 'vault';
  version: 1;
  kdf: Kdf;
  check: Envelope;
}
export interface WorkspaceRow {
  id: 'workspace';
  revision: number;
  data: Envelope;
}
export interface DeviceKeyRow {
  id: 'device';
  key: CryptoKey;
  legacyImported: boolean;
}

// Keep the original database and schema untouched for recovery and rollback.
export class LegacyDatabase extends Dexie {
  vault!: EntityTable<VaultRow, 'id'>;
  workspace!: EntityTable<WorkspaceRow, 'id'>;
  constructor(name = 'service-desk-v1') {
    super(name);
    this.version(1).stores({ vault: '&id', workspace: '&id' });
  }
}
export class DeskDatabase extends Dexie {
  deviceKeys!: EntityTable<DeviceKeyRow, 'id'>;
  localWorkspace!: EntityTable<WorkspaceRow, 'id'>;
  constructor(name = 'service-desk-local-v2') {
    super(name);
    this.version(1).stores({ deviceKeys: '&id', localWorkspace: '&id' });
  }
}
export const db = new DeskDatabase();
export const legacyDb = new LegacyDatabase();
