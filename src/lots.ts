import type { Lot, RackData } from './types';

export interface Totals {
  done: number;
  total: number;
}

export function rackTotals(r: RackData): Totals {
  return { done: r.items.filter((i) => i.done).length, total: r.items.length };
}

export function lotTotals(lot: Lot): Totals {
  return lot.racks.reduce<Totals>(
    (acc, r) => {
      const t = rackTotals(r);
      return { done: acc.done + t.done, total: acc.total + t.total };
    },
    { done: 0, total: 0 },
  );
}

/** Oldest first (server sends newest first). */
export function orderLots(lots: Lot[]): Lot[] {
  return [...lots].sort((a, b) => a.id - b.id);
}

export interface Pending {
  id: string;
  rack: number;
  slot: number;
}

/** First slot not yet done, in rack order. */
export function nextPending(lot: Lot): Pending | null {
  for (const r of [...lot.racks].sort((a, b) => a.rack - b.rack)) {
    const idx = r.items.findIndex((i) => !i.done);
    if (idx >= 0) return { id: r.items[idx]!.id, rack: r.rack, slot: idx + 1 };
  }
  return null;
}

export function withDone(lots: Lot[], lotId: number, id: string, done: boolean): Lot[] {
  return lots.map((l) =>
    l.id !== lotId
      ? l
      : { ...l, racks: l.racks.map((r) => ({ ...r, items: r.items.map((i) => (i.id === id ? { ...i, done } : i)) })) },
  );
}

/** Local midnight (ms) of the day that contains `now`. */
export function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Only today's lots: samples are different every day, so yesterday's list is dropped at midnight. */
export function todaysLots(lots: Lot[], now: number): Lot[] {
  const from = startOfDay(now);
  return lots.filter((l) => l.start >= from);
}
