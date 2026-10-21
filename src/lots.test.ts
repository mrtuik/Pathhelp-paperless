import { describe, expect, it } from 'vitest';
import { lotTotals, nextPending, orderLots, withDone } from './lots';
import type { Lot } from './types';

const lots: Lot[] = [
  { id: 2, start: 2, racks: [{ rack: 1, items: [{ id: '261022PT3', done: false }] }] },
  {
    id: 1,
    start: 1,
    racks: [
      { rack: 2, items: [{ id: '261022PT20', done: false }] },
      { rack: 1, items: [{ id: '261022PT10', done: true }, { id: '261022PT11', done: false }] },
    ],
  },
];

describe('lots helpers', () => {
  it('orders oldest first', () => {
    expect(orderLots(lots).map((l) => l.id)).toEqual([1, 2]);
  });
  it('counts totals', () => {
    expect(lotTotals(lots[1]!)).toEqual({ done: 1, total: 3 });
  });
  it('finds the next pending slot in rack order', () => {
    expect(nextPending(lots[1]!)).toEqual({ id: '261022PT11', rack: 1, slot: 2 });
  });
  it('returns null when everything is done', () => {
    const all = withDone(lots, 2, '261022PT3', true);
    expect(nextPending(all[0]!)).toBeNull();
  });
});
