export interface ParsedOcr {
  rack: number | null;
  ids: string[];
}

/** Common OCR mix-ups inside digit groups: O->0, I/L->1, S->5, B->8. */
function fixDigits(s: string): string {
  return s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/S/g, '5').replace(/B/g, '8');
}

/** Pulls PT numbers and the rack number out of raw OCR text (same rules as the Apps Script parser). */
export function parseOcrText(text: string): ParsedOcr {
  const ids: string[] = [];
  const re = /([0-9OILSB]{6})\s*[PF]\s*[T7]\s*([0-9OILSB]{1,4})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const d = fixDigits(m[1]!);
    const n = fixDigits(m[2]!).replace(/^0+(?=\d)/, '');
    const month = Number(d.slice(2, 4));
    const day = Number(d.slice(4, 6));
    if (!/^\d{6}$/.test(d) || !/^\d+$/.test(n) || month < 1 || month > 12 || day < 1 || day > 31) continue;
    const id = `${d}PT${n}`;
    if (!ids.includes(id)) ids.push(id);
  }

  let rack: number | null = null;
  const rm = /RACK\s*NUMBER[^0-9OIL]{0,3}([0-9OIL]{1,2})/i.exec(text);
  if (rm) {
    const v = parseInt(fixDigits(rm[1]!), 10);
    if (v > 0) rack = v;
  }
  return { ids, rack };
}
