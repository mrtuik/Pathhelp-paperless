import type { ChatMsg } from './types';

/** Racks that were uploaded successfully into `lot` during this chat, lowest first. */
export function racksInLot(messages: ChatMsg[], lot: number): number[] {
  const racks = new Set<number>();
  for (const m of messages) {
    if (m.role === 'assistant' && m.status === 'ok' && m.result?.lot === lot) racks.add(m.result.rack);
  }
  return [...racks].sort((a, b) => a - b);
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
