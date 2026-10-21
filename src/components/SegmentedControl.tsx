import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';

export interface Segment {
  value: number;
  label: string;
}

interface Props {
  segments: Segment[];
  value: number | null;
  onChange: (value: number) => void;
}

/** Tap a segment, or drag a finger across the control and release to select. */
export function SegmentedControl({ segments, value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setOverflow(el.scrollWidth > el.clientWidth + 1);
    el.querySelector<HTMLElement>('[aria-checked="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [segments.length, value]);

  const valueAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-value]');
    if (!el || !ref.current?.contains(el)) return null;
    return Number(el.dataset.value);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    setPreview(valueAt(e.clientX, e.clientY));
    if (!overflow) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (preview === null && e.buttons === 0) return;
    setPreview(valueAt(e.clientX, e.clientY));
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const v = valueAt(e.clientX, e.clientY) ?? preview;
    setPreview(null);
    if (v !== null) onChange(v);
  };

  return (
    <div
      ref={ref}
      className={`segmented${overflow ? ' segmented-scroll' : ''}`}
      role="radiogroup"
      aria-label="Lot"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => setPreview(null)}
    >
      {segments.map((s) => {
        const active = (preview ?? value) === s.value;
        return (
          <div key={s.value} data-value={s.value} role="radio" aria-checked={value === s.value} className={`segment${active ? ' segment-active' : ''}`}>
            {s.label}
          </div>
        );
      })}
    </div>
  );
}
