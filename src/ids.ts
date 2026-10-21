export const PT_RE = /^\d{6}PT\d{1,4}$/;

export function normalizeId(s: string): string {
  return s.toUpperCase().replace(/\s+/g, '');
}

export function isValidId(s: string): boolean {
  return PT_RE.test(s);
}

export interface ParsedIds {
  valid: string[];
  invalid: string[];
}

/** Turns the textarea content (one PT per line) into clean, de-duplicated ids. */
export function parseIdText(text: string): ParsedIds {
  const valid: string[] = [];
  const invalid: string[] = [];
  const addValid = (id: string): void => {
    if (!valid.includes(id)) valid.push(id);
  };
  for (const line of text.split(/[\n,;]+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const joined = normalizeId(trimmed);
    if (isValidId(joined)) {
      addValid(joined);
      continue;
    }
    const tokens = trimmed.split(/\s+/).map(normalizeId);
    if (tokens.length > 1 && tokens.every(isValidId)) {
      tokens.forEach(addValid);
      continue;
    }
    if (!invalid.includes(joined)) invalid.push(joined);
  }
  return { valid, invalid };
}
