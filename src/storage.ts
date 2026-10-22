import type { ChatMsg, Lot } from './types';

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

export function loadChat(): ChatMsg[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // A message that was still sending when the app closed is shown as not sent (with Retry).
    return (parsed as ChatMsg[]).map((m) =>
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
