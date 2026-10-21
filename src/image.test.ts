import { describe, expect, it } from 'vitest';
import { fitSize, stripDataUrlPrefix } from './image';

describe('fitSize', () => {
  it('keeps small images', () => {
    expect(fitSize(800, 600, 1800)).toEqual({ width: 800, height: 600 });
  });
  it('scales landscape by width', () => {
    expect(fitSize(4000, 3000, 1800)).toEqual({ width: 1800, height: 1350 });
  });
  it('scales portrait by height', () => {
    expect(fitSize(3000, 4000, 1800)).toEqual({ width: 1350, height: 1800 });
  });
});

describe('stripDataUrlPrefix', () => {
  it('removes the data: prefix', () => {
    expect(stripDataUrlPrefix('data:image/jpeg;base64,AAAA')).toBe('AAAA');
  });
  it('leaves plain base64 alone', () => {
    expect(stripDataUrlPrefix('AAAA')).toBe('AAAA');
  });
});
