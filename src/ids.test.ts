import { describe, expect, it } from 'vitest';
import { PT_RE, normalizeId, parseIdText } from './ids';

describe('PT id regex', () => {
  it('accepts valid ids', () => {
    expect(PT_RE.test('261022PT150')).toBe(true);
    expect(PT_RE.test('261022PT1')).toBe(true);
    expect(PT_RE.test('261022PT9999')).toBe(true);
  });
  it('rejects invalid ids', () => {
    expect(PT_RE.test('261022PT')).toBe(false);
    expect(PT_RE.test('261022PT12345')).toBe(false);
    expect(PT_RE.test('26102PT150')).toBe(false);
    expect(PT_RE.test('261022pt150')).toBe(false);
  });
});

describe('normalizeId', () => {
  it('uppercases and strips whitespace', () => {
    expect(normalizeId(' 261022 pt150 ')).toBe('261022PT150');
  });
});

describe('parseIdText', () => {
  it('parses one per line, dedupes and uppercases', () => {
    const r = parseIdText('261022pt150\n261022PT151\n261022PT150\n\n');
    expect(r.valid).toEqual(['261022PT150', '261022PT151']);
    expect(r.invalid).toEqual([]);
  });
  it('reports invalid lines', () => {
    const r = parseIdText('261022PT150\nhello');
    expect(r.valid).toEqual(['261022PT150']);
    expect(r.invalid).toEqual(['HELLO']);
  });
  it('splits several ids on one line', () => {
    expect(parseIdText('261022PT150 261022PT151').valid).toEqual(['261022PT150', '261022PT151']);
  });
  it('joins an id broken by a space', () => {
    expect(parseIdText('261022 PT150').valid).toEqual(['261022PT150']);
  });
});

describe('parseIdList (one PT per box)', () => {
  it('cleans each box, drops blanks and duplicates, flags typos', async () => {
    const { parseIdList } = await import('./ids');
    const r = parseIdList(['261022pt150', ' ', '261022PT150', '2610PT1']);
    expect(r.valid).toEqual(['261022PT150']);
    expect(r.invalid).toEqual(['2610PT1']);
  });
});
