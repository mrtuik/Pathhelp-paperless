import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { withDone } from './lots';
import { loadCachedLots, saveCachedLots } from './storage';
import type { Lot } from './types';

export function useLots() {
  const [lots, setLots] = useState<Lot[]>(() => loadCachedLots());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lotsRef = useRef<Lot[]>(lots);

  const apply = useCallback((next: Lot[]) => {
    lotsRef.current = next;
    setLots(next);
    saveCachedLots(next);
  }, []);

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        apply(await api.list());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [apply],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Optimistic update; rolls back and rethrows if the server refuses. */
  const setDone = useCallback(
    async (lotId: number, id: string, done: boolean) => {
      apply(withDone(lotsRef.current, lotId, id, done));
      try {
        await api.setDone(id, done);
      } catch (e) {
        apply(withDone(lotsRef.current, lotId, id, !done));
        throw e;
      }
      void refresh(true);
    },
    [apply, refresh],
  );

  return { lots, loading, error, refresh, setDone };
}
