import type { Lot } from './types';

const KEY = 'pathhelp.lots.v1';

export function loadCachedLots(): Lot[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Lot[]) : [];
  } catch {
    return [];
  }
}

export function saveCachedLots(lots: Lot[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(lots));
  } catch {
    /* storage full or unavailable: ignore */
  }
}
