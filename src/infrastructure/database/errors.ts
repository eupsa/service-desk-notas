export class ConflictError extends Error {
  constructor() {
    super('conflict');
  }
}
export class RecoveryWouldOverwriteError extends Error {
  constructor() {
    super('recovery-would-overwrite');
  }
}
