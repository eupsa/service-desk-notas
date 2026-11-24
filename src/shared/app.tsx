import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ExternalLink, Settings as SettingsIcon } from 'lucide-react';
import { useWorkspace } from '../features/tickets/use-workspace';
import { TicketEditor } from '../features/ticket-editor/ticket-editor';
import { SettingsPanel } from '../features/settings/settings-panel';
import { LegacyRecovery } from '../features/legacy-recovery/legacy-recovery';
import type { Ticket } from '../features/tickets/model';
import { Button } from './components/ui/button';
import { openDashboard, openOptions } from '../infrastructure/browser/pages';

export function App({ page = 'editor' }: { page?: 'editor' | 'settings' }) {
  const { t, i18n } = useTranslation();
  const { workspace, update, status, reload, reloadId, retry } = useWorkspace();
  const latest = useRef(workspace);
  useEffect(() => {
    latest.current = workspace;
  }, [workspace]);
  const changeTicket = useCallback(
    (ticket: Ticket) => {
      if (latest.current) update({ ...latest.current, ticket });
    },
    [update],
  );
  useEffect(() => {
    if (!workspace) return;
    void i18n.changeLanguage(workspace.settings.language);
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        workspace.settings.theme === 'dark' ||
          (workspace.settings.theme === 'system' && media.matches),
      );
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [workspace, i18n]);
  if (!workspace)
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p role="status">
          {t(status === 'saveError' ? 'saveError' : 'loading')}
        </p>
        {status === 'saveError' && (
          <Button onClick={() => void reload()}>{t('retry')}</Button>
        )}
      </main>
    );
  return (
    <main
      className={`mx-auto max-w-2xl px-5 py-4 sm:px-8 sm:py-8 ${workspace.settings.density === 'compact' ? 'compact' : ''}`}
    >
      <header className="mb-5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 id="page-heading" className="text-lg font-semibold">
            {t(page === 'settings' ? 'settings' : 'editor')}
          </h1>
          <p
            role="status"
            className="mt-0.5 flex items-center gap-1 text-xs text-secondary"
          >
            {status === 'saved' && (
              <Check size={14} className="text-success" aria-hidden="true" />
            )}
            {t(status)}
          </p>
        </div>
        <nav aria-label="Service Desk" className="flex shrink-0">
          <Button
            variant="icon"
            className="text-secondary"
            onClick={() => void openDashboard()}
            aria-label={t('dashboard')}
            title={t('dashboard')}
          >
            <ExternalLink size={20} aria-hidden="true" />
          </Button>
          <Button
            variant="icon"
            className="text-secondary"
            onClick={() => void openOptions()}
            aria-label={t('settings')}
            title={t('settings')}
          >
            <SettingsIcon size={20} aria-hidden="true" />
          </Button>
        </nav>
      </header>
      {(status === 'conflict' || status === 'saveError') && (
        <aside
          role="alert"
          className="mb-5 space-y-3 rounded-lg border border-input bg-muted p-4"
        >
          <p>{t(status)}</p>
          <Button variant="outline" onClick={() => void reload()}>
            {t('reload')}
          </Button>
          {status === 'saveError' && (
            <Button onClick={retry}>{t('retry')}</Button>
          )}
        </aside>
      )}
      <LegacyRecovery onRecovered={reload} disabled={status !== 'saved'} />
      {page === 'settings' ? (
        <SettingsPanel
          value={workspace.settings}
          onChange={(settings) => update({ ...workspace, settings })}
        />
      ) : (
        <TicketEditor
          key={reloadId}
          value={workspace.ticket}
          settings={workspace.settings}
          onChange={changeTicket}
        />
      )}
    </main>
  );
}
