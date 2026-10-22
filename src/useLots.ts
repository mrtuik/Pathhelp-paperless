import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { startOfDay, todaysLots, withDone } from './lots';
import { loadCachedLots, saveCachedLots } from './storage';
import type { Lot } from './types';

export function useLots() {
  const [lots, setLots] = useState<Lot[]>(() => loadCachedLots());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lotsRef = useRef<Lot[]>(lots);
  const busyRef = useRef(false);
  const [dayStart, setDayStart] = useState(() => startOfDay(Date.now()));

  const apply = useCallback((next: Lot[]) => {
    lotsRef.current = next;
    setLots(next);
    saveCachedLots(next);
  }, []);

  const refresh = useCallback(
    async (silent = false) => {
      if (busyRef.current) return;
      busyRef.current = true;
      if (!silent) setLoading(true);
      try {
        apply(await api.list());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        busyRef.current = false;
        if (!silent) setLoading(false);
      }
    },
    [apply],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Automatic refresh: every 20 s while the app is open, and when it comes back to the front.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      const today = startOfDay(Date.now());
      setDayStart((d) => (d === today ? d : today)); // new day: yesterday's lots disappear
      void refresh();
    };
    const timer = window.setInterval(tick, 20_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
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

  const today = todaysLots(lots, dayStart + 1);
  return { lots: today, loading, error, refresh, setDone, dayStart };
}
