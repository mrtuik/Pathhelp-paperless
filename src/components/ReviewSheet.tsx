import { useMemo } from 'react';
import { plural } from '../chat';
import { parseIdList } from '../ids';
import type { Draft } from '../types';
import { AlertIcon, ArrowUpIcon, XIcon } from './Icons';
import { PtBoxes } from './PtBoxes';

interface Props {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onConfirm: () => void;
  /** Close the sheet but keep the photo attached to the message box. */
  onMinimize: () => void;
  /** Throw the photo away. */
  onDiscard: () => void;
  /** Open the photo full screen. */
  onPreview: () => void;
}

/** Bottom sheet that shows the rack number and every PT number (one box each) read from the photo. Confirm sends them. */
export function ReviewSheet({ draft, onChange, onConfirm, onMinimize, onDiscard, onPreview }: Props) {
  const parsed = useMemo(() => parseIdList(draft.ids), [draft.ids]);

  return (
    <div className="sheet-backdrop" onClick={onMinimize}>
      <div className="sheet review" role="dialog" aria-label="Confirm rack" onClick={(e) => e.stopPropagation()}>
        <div className="review-head">
          <div className="review-title">Confirm rack</div>
          <button type="button" className="round-btn" aria-label="Close" onClick={onMinimize}>
            <XIcon size={20} />
          </button>
        </div>

        <div className="review-body">
          <div className="review-top">
            {draft.thumb && (
              <button type="button" className="thumb-btn" aria-label="Preview photo" onClick={onPreview}>
                <img className="review-thumb" src={draft.thumb} alt="Rack photo" />
              </button>
            )}
            <label className="field review-rack">
              <span className="field-label">Rack number</span>
              <input
                className="input mono"
                type="number"
                inputMode="numeric"
                min={1}
                value={draft.rack}
                onChange={(e) => onChange({ rack: e.target.value, error: null })}
                disabled={draft.reading}
              />
            </label>
          </div>

          {draft.error && (
            <div className="banner banner-error">
              <AlertIcon size={16} />
              <span>{draft.error}</span>
            </div>
          )}

          {draft.reading ? (
            <div className="reading">
              <div className="spinner spinner-sm" />
              <span>Reading numbers…</span>
            </div>
          ) : (
            <>
              <div className="ids-head">
                <span className="field-label">
                  {parsed.valid.length === 0 ? 'No PT numbers' : plural(parsed.valid.length, 'PT number')}
                  {parsed.invalid.length > 0 && ` · ${parsed.invalid.length} not valid`}
                </span>
              </div>
              {draft.noPt && draft.ids.length === 0 && <div className="banner banner-warn">No PT numbers were found. Retake the photo, or add them below.</div>}
              <PtBoxes ids={draft.ids} onChange={(ids) => onChange({ ids, noPt: false, error: null })} />
            </>
          )}

          <label className="check">
            <input type="checkbox" checked={draft.newLot} onChange={(e) => onChange({ newLot: e.target.checked })} />
            <span>Start a new Lot with this photo</span>
          </label>
        </div>

        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={onDiscard}>
            Discard
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={draft.reading}>
            <ArrowUpIcon size={18} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
