import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { startOfDay, todaysLots, withDone } from './lots';
import { loadCachedLots, loadResetAt, saveCachedLots, saveResetAt, setForceNewLot } from './storage';
import type { Lot } from './types';

export function useLots() {
  const [lots, setLots] = useState<Lot[]>(() => loadCachedLots());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lotsRef = useRef<Lot[]>(lots);
  const busyRef = useRef(false);
  const archivedFor = useRef(0);
  const [resetAt, setResetAt] = useState(() => loadResetAt());
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
        let next = await api.list();
        // New day: yesterday's rows move to the Archive tab (once per day) so Lots start again from 1.
        const cutoff = startOfDay(Date.now());
        if (archivedFor.current !== cutoff && next.some((l) => l.start < cutoff)) {
          archivedFor.current = cutoff;
          try {
            await api.archive(cutoff);
            next = await api.list();
          } catch {
            /* old script without the archive action: the list is still hidden on this phone */
          }
        }
        apply(next);
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

  /** Manual reset. Returns true when the sheet was reset too (Lots start again from 1). */
  const resetLots = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    saveResetAt(now);
    setResetAt(now);
    apply([]);
    try {
      await api.archive(9e15); // everything saved so far goes to the Archive tab
      setForceNewLot(false);
      return true;
    } catch {
      setForceNewLot(true); // old script: at least the next photo starts a new Lot
      return false;
    }
  }, [apply]);

  const today = todaysLots(lots, dayStart + 1, resetAt);
  return { lots: today, loading, error, refresh, setDone, resetAt, resetLots };
}
