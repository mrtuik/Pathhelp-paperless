import { describe, expect, it } from 'vitest';
import { parseOcrText } from './parse';

describe('parseOcrText', () => {
  it('finds ids and the rack number', () => {
    const r = parseOcrText('Rack Number 3\n261022PT150\n261022 PT151\nsomething else');
    expect(r.rack).toBe(3);
    expect(r.ids).toEqual(['261022PT150', '261022PT151']);
  });

  it('fixes common OCR letter/digit confusions', () => {
    expect(parseOcrText('26I022PT15O').ids).toEqual(['261022PT150']);
    expect(parseOcrText('2610ZZPT1').ids).toEqual([]);
  });

  it('tolerates P/F and T/7 mix-ups and drops leading zeros', () => {
    expect(parseOcrText('261022F7007').ids).toEqual(['261022PT7']);
  });

  it('ignores impossible dates', () => {
    expect(parseOcrText('999999PT1').ids).toEqual([]);
  });

  it('removes duplicates', () => {
    expect(parseOcrText('261022PT150 261022PT150').ids).toEqual(['261022PT150']);
  });

  it('returns null rack when missing', () => {
    expect(parseOcrText('261022PT150').rack).toBeNull();
  });

  it('reads a rack number with confusable letters', () => {
    expect(parseOcrText('RACK NUMBER: l2').rack).toBe(12);
  });
});
