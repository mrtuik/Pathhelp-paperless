import { useRef } from 'react';
import { isValidId, normalizeId } from '../ids';
import { PlusIcon, XIcon } from './Icons';

interface Props {
  ids: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

/** Every PT number in its own box (edit, remove, add). Two boxes per row. */
export function PtBoxes({ ids, onChange, disabled }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  const setAt = (i: number, value: string) => onChange(ids.map((v, j) => (j === i ? value.toUpperCase() : v)));
  const removeAt = (i: number) => onChange(ids.filter((_, j) => j !== i));
  const add = () => {
    onChange([...ids, '']);
    // focus the new box after it renders
    window.setTimeout(() => {
      const inputs = gridRef.current?.querySelectorAll<HTMLInputElement>('input');
      inputs?.[inputs.length - 1]?.focus();
    }, 30);
  };

  return (
    <div className="ptboxes">
      <div className="ptgrid" ref={gridRef}>
        {ids.map((id, i) => {
          const bad = id.trim() !== '' && !isValidId(normalizeId(id));
          return (
            <div key={i} className={`ptbox${bad ? ' ptbox-bad' : ''}`}>
              <input
                className="ptinput mono"
                value={id}
                onChange={(e) => setAt(i, e.target.value)}
                placeholder="261022PT150"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                disabled={disabled}
                aria-label={`PT number ${i + 1}`}
              />
              <button type="button" className="ptremove" aria-label={`Remove PT number ${i + 1}`} onClick={() => removeAt(i)} disabled={disabled}>
                <XIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={add} disabled={disabled}>
        <PlusIcon size={16} /> Add PT number
      </button>
    </div>
  );
}
