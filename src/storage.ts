import type { ChatMsg, Lot } from './types';
import { startOfDay } from './lots';

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

const CHAT_KEY = 'pathhelp.chat.v1';
const CHAT_MAX = 40;

/** Message ids are `u<ms>` / `a<ms>`: keep only today's messages (the list resets every day). */
export function onlyToday(messages: ChatMsg[], now: number = Date.now()): ChatMsg[] {
  const from = Math.max(startOfDay(now), loadResetAt());
  return messages.filter((m) => Number(m.id.slice(1)) >= from);
}

export function loadChat(): ChatMsg[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // A message that was still sending when the app closed is shown as not sent (with Retry).
    return onlyToday(parsed as ChatMsg[]).map((m) =>
      m.role === 'assistant' && m.status === 'pending' ? { ...m, status: 'error' as const, error: 'Not sent. Tap Retry.' } : m,
    );
  } catch {
    return [];
  }
}

export function saveChat(messages: ChatMsg[]): void {
  const recent = messages.slice(-CHAT_MAX);
  // Photos are the big part. If storage is full, keep fewer photos (newest first), then none.
  for (const keepPhotos of [CHAT_MAX, 8, 3, 0]) {
    const cut = recent.length - keepPhotos;
    const data = recent.map((m, i) => (m.role === 'user' && i < cut ? { ...m, thumb: '' } : m));
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(data));
      return;
    } catch {
      /* too big: try again with fewer photos */
    }
  }
}

/** Manual "Reset lots": everything older than this moment is hidden (nothing is deleted from the sheet). */
const RESET_KEY = 'pathhelp.resetAt.v1';
export function loadResetAt(): number {
  try {
    return Number(localStorage.getItem(RESET_KEY)) || 0;
  } catch {
    return 0;
  }
}
export function saveResetAt(ms: number): void {
  try {
    localStorage.setItem(RESET_KEY, String(ms));
  } catch {
    /* ignore */
  }
}

/** After a reset the next rack photo must start a fresh Lot (otherwise it could join a hidden one). */
const FORCE_KEY = 'pathhelp.forceNewLot.v1';
export function loadForceNewLot(): boolean {
  try {
    return localStorage.getItem(FORCE_KEY) === '1';
  } catch {
    return false;
  }
}
export function setForceNewLot(on: boolean): void {
  try {
    if (on) localStorage.setItem(FORCE_KEY, '1');
    else localStorage.removeItem(FORCE_KEY);
  } catch {
    /* ignore */
  }
}
