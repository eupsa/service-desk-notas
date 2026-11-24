import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db, legacyDb } from '../../infrastructure/database/database';
import { RecoveryWouldOverwriteError } from '../../infrastructure/database/errors';
import { localRepository } from '../tickets/local-repository';
import { Button } from '../../shared/components/ui/button';

export function LegacyRecovery({
  onRecovered,
  disabled,
}: {
  onRecovered: () => Promise<void>;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const available = useLiveQuery(
    async () =>
      Boolean(await legacyDb.vault.get('vault')) &&
      !(await db.deviceKeys.get('device'))?.legacyImported,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = String(new FormData(form).get('legacyPassword') ?? '');
    setBusy(true);
    setError('');
    try {
      await localRepository.recoverLegacy(password);
      await onRecovered();
    } catch (error) {
      setError(
        error instanceof RecoveryWouldOverwriteError
          ? 'legacyOccupied'
          : 'legacyError',
      );
    } finally {
      form.reset();
      setBusy(false);
    }
  }
  if (!available) return null;
  return (
    <details className="form-section mb-5">
      <summary>{t('legacyTitle')}</summary>
      <p className="my-4 text-sm text-secondary">{t('legacyHint')}</p>
      <form onSubmit={(event) => void recover(event)} className="space-y-3">
        <div>
          <label htmlFor="legacy-password">{t('legacyPassword')}</label>
          <input
            id="legacy-password"
            name="legacyPassword"
            type="password"
            autoComplete="current-password"
            maxLength={1024}
            required
            disabled={busy || disabled}
          />
        </div>
        <Button disabled={busy || disabled}>
          {t(busy ? 'loading' : 'legacyRecover')}
        </Button>
        {error && (
          <p role="alert" className="text-sm">
            {t(error)}
          </p>
        )}
      </form>
    </details>
  );
}
