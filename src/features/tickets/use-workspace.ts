import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/database';
import type { Workspace } from '../tickets/model';
import { ConflictError } from '../../infrastructure/database/errors';
import { localRepository } from './local-repository';

type Snapshot = { value: Workspace; revision: number };
export function useWorkspace() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [status, setStatus] = useState<
    'saved' | 'saving' | 'saveError' | 'conflict'
  >('saved');
  const [reloadId, setReloadId] = useState(0);
  const [tick, setTick] = useState(0);
  const latest = useRef<Snapshot | undefined>(undefined);
  const dirty = useRef(false);
  const running = useRef(false);
  const mounted = useRef(true);
  const edit = useRef(0);
  const observed = useLiveQuery(() => db.localWorkspace.get('workspace'));
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      latest.current = undefined;
    };
  }, []);
  const reload = useCallback(async () => {
    try {
      const loaded = await localRepository.load();
      if (!mounted.current) return;
      latest.current = loaded;
      dirty.current = false;
      setSnapshot(loaded);
      setStatus('saved');
      setReloadId((n) => n + 1);
    } catch {
      if (mounted.current) setStatus('saveError');
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    if (
      !snapshot ||
      !observed ||
      running.current ||
      // A notificação do próprio salvamento pode chegar atrasada com a revisão
      // anterior; só revisões mais novas vêm de outra janela.
      observed.revision <= (latest.current?.revision ?? 0)
    )
      return;
    if (dirty.current) setStatus('conflict');
    else void reload();
  }, [observed, snapshot, status, reload]);
  const update = useCallback((value: Workspace) => {
    if (!latest.current) return;
    edit.current++;
    dirty.current = true;
    latest.current = { ...latest.current, value };
    setSnapshot(latest.current);
    setStatus((current) => (current === 'conflict' ? current : 'saving'));
  }, []);
  useEffect(() => {
    if (
      !dirty.current ||
      !snapshot ||
      status === 'conflict' ||
      status === 'saveError'
    )
      return;
    const timer = setTimeout(() => {
      if (running.current || !latest.current) return;
      running.current = true;
      const current = latest.current;
      const version = edit.current;
      void localRepository
        .save(current.value, current.revision)
        .then((revision) => {
          if (!mounted.current || !latest.current) return;
          latest.current = { value: latest.current.value, revision };
          dirty.current = version !== edit.current;
          setSnapshot(latest.current);
          setStatus(dirty.current ? 'saving' : 'saved');
        })
        .catch((error: unknown) => {
          if (mounted.current)
            setStatus(
              error instanceof ConflictError ? 'conflict' : 'saveError',
            );
        })
        .finally(() => {
          running.current = false;
          if (mounted.current) setTick((n) => n + 1);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [snapshot, status, tick]);
  return {
    workspace: snapshot?.value,
    update,
    status,
    reload,
    reloadId,
    retry: () => setStatus('saving'),
  };
}
