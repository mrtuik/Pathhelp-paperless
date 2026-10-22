import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApi } from './api';

function mockFetch(body: unknown, status = 200) {
  return vi.fn(async (_input: string, _init?: RequestInit) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));
}

const base = { url: 'https://example.test/exec', token: 'tok' };

describe('api client', () => {
  it('list calls GET with action and token', async () => {
    const f = mockFetch({ ok: true, lots: [{ id: 1, start: 1, racks: [] }] });
    const lots = await createApi({ ...base, fetchFn: f }).list();
    expect(lots).toHaveLength(1);
    const url = String(f.mock.calls[0]![0]);
    expect(url).toContain('action=list');
    expect(url).toContain('token=tok');
  });

  it('setDone sends value=1 / value=0', async () => {
    const f = mockFetch({ ok: true });
    const api = createApi({ ...base, fetchFn: f });
    await api.setDone('261022PT150', true);
    await api.setDone('261022PT150', false);
    expect(String(f.mock.calls[0]![0])).toContain('value=1');
    expect(String(f.mock.calls[1]![0])).toContain('value=0');
    expect(String(f.mock.calls[0]![0])).toContain('id=261022PT150');
  });

  it('ocr posts text/plain JSON without data: prefix', async () => {
    const f = mockFetch({ ok: true, rack: 3, ids: ['261022PT150'], raw: 'x' });
    const r = await createApi({ ...base, fetchFn: f }).ocr('AAAA');
    expect(r).toEqual({ rack: 3, ids: ['261022PT150'], raw: 'x' });
    const init = f.mock.calls[0]![1]!;
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('text/plain');
    expect(JSON.parse(String(init.body))).toEqual({ token: 'tok', action: 'ocr', image: 'AAAA', mime: 'image/jpeg' });
  });

  it('save posts rack, ids and newLot', async () => {
    const f = mockFetch({ ok: true, lot: 4, rack: 2, added: 5, updated: 1 });
    const r = await createApi({ ...base, fetchFn: f }).save(2, ['261022PT150'], true);
    expect(r).toEqual({ lot: 4, rack: 2, added: 5, updated: 1 });
    expect(JSON.parse(String(f.mock.calls[0]![1]!.body))).toMatchObject({ action: 'save', rack: 2, ids: ['261022PT150'], newLot: true });
  });

  it('throws the server error message', async () => {
    const api = createApi({ ...base, fetchFn: mockFetch({ ok: false, error: 'bad token' }) });
    await expect(api.list()).rejects.toThrow('bad token');
  });

  it('throws on non-JSON responses', async () => {
    const api = createApi({ ...base, fetchFn: mockFetch('<html>oops</html>', 500) });
    await expect(api.list()).rejects.toBeInstanceOf(ApiError);
  });

  it('wraps network errors', async () => {
    const f = vi.fn(async () => {
      throw new Error('offline');
    });
    await expect(createApi({ ...base, fetchFn: f }).list()).rejects.toThrow('Network error: offline');
  });

  it('edit and delete actions post the right payloads', async () => {
    const f = mockFetch({ ok: true });
    const api = createApi({ ...base, fetchFn: f });
    await api.editRack(3, 4, 5, ['261022PT150']);
    await api.deleteRack(3, 5);
    await api.editLot(3, 7);
    await api.deleteLot(7);
    const bodies = f.mock.calls.map((c) => JSON.parse(String(c[1]!.body)));
    expect(bodies[0]).toEqual({ token: 'tok', action: 'editRack', lot: 3, rack: 4, newRack: 5, ids: ['261022PT150'] });
    expect(bodies[1]).toEqual({ token: 'tok', action: 'deleteRack', lot: 3, rack: 5 });
    expect(bodies[2]).toEqual({ token: 'tok', action: 'editLot', lot: 3, newLot: 7 });
    expect(bodies[3]).toEqual({ token: 'tok', action: 'deleteLot', lot: 7 });
  });
});
