import { describe, expect, it } from 'vitest';
import { plural, racksInLot } from './chat';
import type { ChatMsg } from './types';

const ok = (id: string, lot: number, rack: number): ChatMsg => ({
  id,
  role: 'assistant',
  status: 'ok',
  rack,
  ids: [],
  newLot: false,
  result: { lot, rack, added: 1, updated: 0 },
});

describe('racksInLot', () => {
  it('lists unique racks of that lot, sorted', () => {
    const msgs: ChatMsg[] = [ok('a', 5, 3), ok('b', 5, 1), ok('c', 6, 2), ok('d', 5, 3)];
    expect(racksInLot(msgs, 5)).toEqual([1, 3]);
  });
  it('ignores pending and failed uploads', () => {
    const msgs: ChatMsg[] = [
      { id: 'p', role: 'assistant', status: 'pending', rack: 2, ids: [], newLot: false },
      { id: 'e', role: 'assistant', status: 'error', rack: 4, ids: [], newLot: false, error: 'x' },
    ];
    expect(racksInLot(msgs, 1)).toEqual([]);
  });
});

describe('plural', () => {
  it('adds s except for one', () => {
    expect(plural(1, 'PT number')).toBe('1 PT number');
    expect(plural(12, 'PT number')).toBe('12 PT numbers');
  });
});
