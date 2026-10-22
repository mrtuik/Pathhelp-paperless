import { useState } from 'react';
import type { ReactNode } from 'react';
import { plural } from '../chat';
import { parseIdList } from '../ids';
import { AlertIcon, PencilIcon, TrashIcon, XIcon } from './Icons';
import { PtBoxes } from './PtBoxes';

interface FrameProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}

function Frame({ title, onClose, children, footer }: FrameProps) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet review" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="review-head">
          <div className="review-title">{title}</div>
          <button type="button" className="round-btn" aria-label="Close" onClick={onClose}>
            <XIcon size={20} />
          </button>
        </div>
        <div className="review-body">{children}</div>
        <div className="row">{footer}</div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="banner banner-error">
      <AlertIcon size={16} />
      <span>{message}</span>
    </div>
  );
}

interface MenuProps {
  title: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** First step: choose Edit or Delete for a Lot or a Rack. */
export function ManageMenu({ title, onEdit, onDelete, onClose }: MenuProps) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">{title}</div>
        <button type="button" className="btn btn-secondary" onClick={onEdit}>
          <PencilIcon size={18} /> Edit
        </button>
        <button type="button" className="btn btn-secondary btn-danger-text" onClick={onDelete}>
          <TrashIcon size={18} /> Delete
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

interface EditRackProps {
  lot: number;
  rack: number;
  initialIds: string[];
  busy: boolean;
  error: string | null;
  onSave: (newRack: number, ids: string[]) => void;
  onClose: () => void;
}

export function EditRackSheet({ lot, rack, initialIds, busy, error, onSave, onClose }: EditRackProps) {
  const [rackText, setRackText] = useState(String(rack));
  const [ids, setIds] = useState<string[]>(initialIds);
  const [problem, setProblem] = useState<string | null>(null);
  const parsed = parseIdList(ids);

  const save = () => {
    const n = Number(rackText);
    if (!Number.isInteger(n) || n < 1) {
      setProblem('Enter the rack number (1 or higher).');
      return;
    }
    if (parsed.invalid.length) {
      setProblem(`These do not look like PT numbers: ${parsed.invalid.join(', ')}. Format: 261022PT150`);
      return;
    }
    if (!parsed.valid.length) {
      setProblem('Add at least one PT number, or delete the rack.');
      return;
    }
    setProblem(null);
    onSave(n, parsed.valid);
  };

  return (
    <Frame
      title={`Edit Rack ${rack} · Lot ${lot}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <label className="field">
        <span className="field-label">Rack number</span>
        <input className="input mono" type="number" inputMode="numeric" min={1} value={rackText} onChange={(e) => setRackText(e.target.value)} disabled={busy} />
      </label>
      <ErrorBanner message={problem ?? error} />
      <div className="ids-head">
        <span className="field-label">{plural(parsed.valid.length, 'PT number')}</span>
      </div>
      <PtBoxes ids={ids} onChange={(next) => { setIds(next); setProblem(null); }} disabled={busy} />
    </Frame>
  );
}

interface EditLotProps {
  lot: number;
  busy: boolean;
  error: string | null;
  onSave: (newLot: number) => void;
  onClose: () => void;
}

export function EditLotSheet({ lot, busy, error, onSave, onClose }: EditLotProps) {
  const [text, setText] = useState(String(lot));
  const [problem, setProblem] = useState<string | null>(null);

  const save = () => {
    const n = Number(text);
    if (!Number.isInteger(n) || n < 1) {
      setProblem('Enter the lot number (1 or higher).');
      return;
    }
    setProblem(null);
    onSave(n);
  };

  return (
    <Frame
      title={`Edit Lot ${lot}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <label className="field">
        <span className="field-label">Lot number</span>
        <input className="input mono" type="number" inputMode="numeric" min={1} value={text} onChange={(e) => setText(e.target.value)} disabled={busy} />
      </label>
      <ErrorBanner message={problem ?? error} />
      <p className="muted small">All racks and PT numbers in this lot move to the new number. The number must not be used by another lot.</p>
    </Frame>
  );
}

interface DeleteProps {
  title: string;
  text: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteSheet({ title, text, busy, error, onConfirm, onClose }: DeleteProps) {
  return (
    <Frame
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            <TrashIcon size={18} /> {busy ? 'Deleting…' : 'Delete'}
          </button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <p className="delete-text">{text}</p>
    </Frame>
  );
}
