import { SCRIPT_URL, TOKEN } from './config';
import type { Lot, OcrResult, SaveResult } from './types';

export class ApiError extends Error {}

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

interface Base {
  ok: boolean;
  error?: string;
}

export interface ApiOptions {
  fetchFn?: FetchFn;
  url?: string;
  token?: string;
  timeoutMs?: number;
}

export function createApi(opts: ApiOptions = {}) {
  const url = opts.url ?? SCRIPT_URL;
  const token = opts.token ?? TOKEN;
  const timeoutMs = opts.timeoutMs ?? 90_000;
  // Resolve fetch lazily: CapacitorHttp patches window.fetch at startup.
  const doFetch: FetchFn = opts.fetchFn ?? ((input, init) => fetch(input, init));

  async function request<T extends Base>(input: string, init?: RequestInit): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new ApiError('The request timed out. Check your connection and try again.')), timeoutMs);
    });
    let res: Response;
    try {
      res = await Promise.race([doFetch(input, { redirect: 'follow', ...init }), timeout]);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(`Network error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(`Unexpected response from the server (HTTP ${res.status}).`);
    }
    if (!data || typeof data !== 'object') throw new ApiError('Unexpected response from the server.');
    const body = data as T;
    if (!body.ok) throw new ApiError(body.error || 'Unknown error from the server.');
    return body;
  }

  function get<T extends Base>(params: Record<string, string>): Promise<T> {
    const q = new URLSearchParams({ ...params, token });
    return request<T>(`${url}${url.includes('?') ? '&' : '?'}${q.toString()}`);
  }

  function post<T extends Base>(payload: Record<string, unknown>): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ token, ...payload }),
    });
  }

  return {
    async list(): Promise<Lot[]> {
      const r = await get<Base & { lots?: Lot[] }>({ action: 'list' });
      if (!Array.isArray(r.lots)) throw new ApiError('The server returned no lots.');
      return r.lots;
    },
    async setDone(id: string, done: boolean): Promise<void> {
      await get<Base>({ action: 'done', id, value: done ? '1' : '0' });
    },
    async ocr(imageBase64: string): Promise<OcrResult> {
      const r = await post<Base & Partial<OcrResult>>({ action: 'ocr', image: imageBase64, mime: 'image/jpeg' });
      return { rack: r.rack ?? null, ids: Array.isArray(r.ids) ? r.ids : [], raw: r.raw ?? '' };
    },
    async save(rack: number, ids: string[], newLot: boolean): Promise<SaveResult> {
      const r = await post<Base & Partial<SaveResult>>({ action: 'save', rack, ids, newLot });
      return {
        lot: r.lot ?? 0,
        rack: r.rack ?? rack,
        added: r.added ?? 0,
        updated: r.updated ?? 0,
      };
    },
  };
}

export const api = createApi();
