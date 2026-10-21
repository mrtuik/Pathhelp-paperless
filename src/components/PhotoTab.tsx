import { useState } from 'react';
import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { api } from '../api';
import { downscaleToJpegBase64 } from '../image';
import { parseIdText } from '../ids';
import type { SaveResult } from '../types';
import { CameraIcon, ImageIcon } from './Icons';

type Phase = 'idle' | 'reading' | 'edit' | 'saving';

interface Props {
  onSaved: (result: SaveResult) => void;
}

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export function PhotoTab({ onSaved }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [rack, setRack] = useState('');
  const [idsText, setIdsText] = useState('');
  const [newLot, setNewLot] = useState(false);
  const [noPt, setNoPt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setPhase('idle');
    setRack('');
    setIdsText('');
    setNewLot(false);
    setNoPt(false);
    setError(null);
  };

  const pick = async (source: CameraSource) => {
    setError(null);
    setSuccess(null);
    let webPath: string | undefined;
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source,
        direction: CameraDirection.Rear,
        correctOrientation: true,
      });
      webPath = photo.webPath;
    } catch (e) {
      const m = errMsg(e);
      if (!/cancel/i.test(m)) setError(`Camera error: ${m}`);
      return;
    }
    if (!webPath) {
      setError('No photo was returned.');
      return;
    }
    setPhase('reading');
    try {
      const base64 = await downscaleToJpegBase64(webPath);
      const r = await api.ocr(base64);
      setRack(r.rack ? String(r.rack) : '');
      setIdsText(r.ids.join('\n'));
      setNoPt(r.ids.length === 0);
      setNewLot(false);
      setPhase('edit');
    } catch (e) {
      setError(errMsg(e));
      setPhase('idle');
    }
  };

  const save = async () => {
    setError(null);
    const rackNum = Number(rack);
    if (!Number.isInteger(rackNum) || rackNum < 1) {
      setError('Enter the rack number (1 or higher).');
      return;
    }
    const { valid, invalid } = parseIdText(idsText);
    if (invalid.length) {
      setError(`These do not look like PT numbers: ${invalid.join(', ')}. Format: 261022PT150`);
      return;
    }
    if (!valid.length) {
      setError('Add at least one PT number.');
      return;
    }
    setPhase('saving');
    try {
      const res = await api.save(rackNum, valid, newLot);
      setSuccess(`Lot ${res.lot} · Rack ${res.rack} — ${res.added} added, ${res.updated} updated`);
      onSaved(res);
      reset();
    } catch (e) {
      setError(errMsg(e));
      setPhase('edit');
    }
  };

  if (phase === 'reading') {
    return (
      <div className="tab">
        <div className="center-fill">
          <div className="spinner" />
          <p>Reading numbers…</p>
        </div>
      </div>
    );
  }

  if (phase === 'edit' || phase === 'saving') {
    const saving = phase === 'saving';
    return (
      <div className="tab">
        <div className="scroll pad">
          <h1 className="title">Check the numbers</h1>
          {noPt && <div className="banner banner-warn">No PT numbers were found. Retake the photo, or type them below.</div>}
          {error && <div className="banner banner-error">{error}</div>}

          <label className="field">
            <span className="field-label">Rack number</span>
            <input className="input mono" type="number" inputMode="numeric" min={1} value={rack} onChange={(e) => setRack(e.target.value)} disabled={saving} />
          </label>

          <label className="field">
            <span className="field-label">PT numbers (one per line)</span>
            <textarea
              className="input mono textarea"
              rows={10}
              value={idsText}
              onChange={(e) => setIdsText(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              disabled={saving}
            />
          </label>

          <label className="check">
            <input type="checkbox" checked={newLot} onChange={(e) => setNewLot(e.target.checked)} disabled={saving} />
            <span>Start a new Lot with this photo</span>
          </label>

          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={reset} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab">
      <div className="scroll pad">
        <h1 className="title">Rack photo</h1>
        <p className="muted">Photograph the analyser rack screen. The PT numbers are read automatically and you can fix them before saving.</p>
        {success && <div className="banner banner-ok">{success}</div>}
        {error && <div className="banner banner-error">{error}</div>}
        <button type="button" className="btn btn-primary btn-big" onClick={() => void pick(CameraSource.Camera)}>
          <CameraIcon size={26} /> Take rack photo
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => void pick(CameraSource.Photos)}>
          <ImageIcon /> Choose from gallery
        </button>
      </div>
    </div>
  );
}
