import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { api } from '../api';
import { plural, racksInLot } from '../chat';
import { downscaleToJpegBase64, thumbDataUrl } from '../image';
import { parseIdList } from '../ids';
import { recognizeText } from '../ocr';
import { parseOcrText } from '../parse';
import { loadChat, onlyToday, saveChat } from '../storage';
import type { ChatAssistantMsg, ChatMsg, Draft, SaveResult } from '../types';
import { CameraView } from './CameraView';
import { AlertIcon, ArrowUpIcon, CameraIcon, GalleryIcon, PlusIcon, RefreshIcon, XIcon } from './Icons';
import { PhotoViewer } from './PhotoViewer';
import { ReviewSheet } from './ReviewSheet';

type Sheet = 'camera' | 'review' | null;

interface Props {
  onSaved: (result: SaveResult) => void;
}

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

function Chips({ ids }: { ids: string[] }) {
  return (
    <div className="chips">
      {ids.map((id) => (
        <span key={id} className="chip mono">
          {id}
        </span>
      ))}
    </div>
  );
}

function AssistantMessage({ msg, lotRacks, onRetry }: { msg: ChatAssistantMsg; lotRacks: number[]; onRetry: () => void }) {
  return (
    <div className="msg msg-ai">
      <div className="ai-avatar" aria-hidden="true">
        <span className="ai-glyph" />
      </div>
      <div className="ai-body">
        {msg.status === 'pending' && (
          <div className="dots" aria-label="Uploading">
            <span />
            <span />
            <span />
          </div>
        )}

        {msg.status === 'ok' && msg.result && (
          <>
            <p className="ai-text">
              <strong>Rack {msg.result.rack}</strong> uploaded to <strong>Lot {msg.result.lot}</strong>. {msg.result.added} added, {msg.result.updated} updated.
            </p>
            <div className="ai-label">{plural(msg.ids.length, 'PT number')} selected</div>
            <Chips ids={msg.ids} />
            {lotRacks.length > 0 && (
              <p className="ai-sub">
                Lot {msg.result.lot} so far: {lotRacks.map((r) => `Rack ${r}`).join(', ')}
              </p>
            )}
          </>
        )}

        {msg.status === 'error' && (
          <>
            <p className="ai-text ai-error">
              <AlertIcon size={16} /> <span>Rack {msg.rack} was not uploaded. {msg.error}</span>
            </p>
            <Chips ids={msg.ids} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
              <RefreshIcon size={16} /> Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function PhotoTab({ onSaved }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>(() => loadChat());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  const keyRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveChat(messages);
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  // New day: yesterday's messages are cleared automatically.
  useEffect(() => {
    const t = window.setInterval(() => setMessages((all) => (onlyToday(all).length === all.length ? all : onlyToday(all))), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  /** Reads the numbers from a JPEG (base64) on the device and fills the confirm sheet. */
  const runOcr = async (base64: string) => {
    const key = ++keyRef.current;
    let thumb = '';
    try {
      thumb = await thumbDataUrl(base64, 1000, 0.6);
    } catch {
      /* no preview: the sheet still works */
    }
    setDraft({ key, thumb, rack: '', ids: [], newLot: false, reading: true, noPt: false, error: null });
    setSheet('review');
    try {
      const r = parseOcrText(await recognizeText(base64));
      setDraft((d) =>
        d && d.key === key ? { ...d, rack: r.rack ? String(r.rack) : '', ids: r.ids, noPt: r.ids.length === 0, reading: false } : d,
      );
    } catch (e) {
      setDraft((d) => (d && d.key === key ? { ...d, reading: false, noPt: true, error: errMsg(e) } : d));
    }
  };

  /** Native picker: used for the gallery, and as a fallback if the live camera cannot start. */
  const pick = async (source: CameraSource) => {
    setNotice(null);
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
      if (!/cancel/i.test(m)) setNotice(`Camera error: ${m}`);
      return;
    }
    if (!webPath) {
      setNotice('No photo was returned.');
      return;
    }
    try {
      // Bigger than the 1800 px default: small screen text reads better at higher resolution.
      await runOcr(await downscaleToJpegBase64(webPath, 2400, 0.9));
    } catch (e) {
      setNotice(errMsg(e));
    }
  };

  const openCamera = () => {
    setMenuOpen(false);
    setNotice(null);
    setSheet('camera');
  };

  const openGallery = () => {
    setMenuOpen(false);
    void pick(CameraSource.Photos);
  };

  /** Uploads one rack and updates its reply in the chat. */
  const send = async (assistantId: string, rack: number, ids: string[], newLot: boolean) => {
    const update = (p: Partial<ChatAssistantMsg>) =>
      setMessages((all) => all.map((m) => (m.role === 'assistant' && m.id === assistantId ? { ...m, ...p } : m)));
    update({ status: 'pending', error: undefined });
    try {
      const res = await api.save(rack, ids, newLot);
      update({ status: 'ok', result: res });
      onSaved(res);
    } catch (e) {
      update({ status: 'error', error: errMsg(e) });
    }
  };

  const confirm = () => {
    if (!draft || draft.reading) return;
    const rack = Number(draft.rack);
    if (!Number.isInteger(rack) || rack < 1) {
      patch({ error: 'Enter the rack number (1 or higher).' });
      return;
    }
    const { valid, invalid } = parseIdList(draft.ids);
    if (invalid.length) {
      patch({ error: `These do not look like PT numbers: ${invalid.join(', ')}. Format: 261022PT150` });
      return;
    }
    if (!valid.length) {
      patch({ error: 'Add at least one PT number.' });
      return;
    }
    const stamp = Date.now();
    const assistantId = `a${stamp}`;
    setMessages((all) => [
      ...all,
      { id: `u${stamp}`, role: 'user', thumb: draft.thumb, rack, count: valid.length },
      { id: assistantId, role: 'assistant', status: 'pending', rack, ids: valid, newLot: draft.newLot },
    ]);
    const newLot = draft.newLot;
    setDraft(null);
    setSheet(null);
    void send(assistantId, rack, valid, newLot);
  };

  const discard = () => {
    setDraft(null);
    setSheet(null);
  };

  const draftCount = useMemo(() => (draft ? parseIdList(draft.ids).valid.length : 0), [draft]);

  return (
    <div className="tab">
      <div className="chat scroll">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="hero-icon" aria-hidden="true" />
            <p className="hero-text">Photograph the analyser rack screen</p>
            <p className="hero-sub">Tap + to add a rack photo</p>
          </div>
        ) : (
          messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="msg msg-user">
                {m.thumb && (
                  <button type="button" className="thumb-btn" aria-label={`Preview rack ${m.rack} photo`} onClick={() => setViewer(m.thumb)}>
                    <img className="user-photo" src={m.thumb} alt={`Rack ${m.rack} photo`} />
                  </button>
                )}
                <div className="user-bubble">
                  Rack {m.rack} · {plural(m.count, 'PT number')}
                </div>
              </div>
            ) : (
              <AssistantMessage
                key={m.id}
                msg={m}
                lotRacks={m.result ? racksInLot(messages, m.result.lot) : []}
                onRetry={() => void send(m.id, m.rack, m.ids, m.newLot)}
              />
            ),
          )
        )}
        <div ref={endRef} />
      </div>

      <div className="composer-wrap">
        {notice && (
          <div className="banner banner-error">
            <AlertIcon size={16} />
            <span>{notice}</span>
          </div>
        )}

        {draft && sheet === null && (
          <div className="attach">
            {draft.thumb && (
              <button type="button" className="thumb-btn" aria-label="Preview photo" onClick={() => setViewer(draft.thumb)}>
                <img src={draft.thumb} alt="" />
              </button>
            )}
            <button type="button" className="attach-text" onClick={() => setSheet('review')}>
              <strong>{draft.rack ? `Rack ${draft.rack}` : 'Rack photo'}</strong>
              <span className="muted small">{draft.reading ? 'Reading…' : plural(draftCount, 'PT number')}</span>
            </button>
            <button type="button" className="round-btn" aria-label="Remove photo" onClick={discard}>
              <XIcon size={18} />
            </button>
          </div>
        )}

        {menuOpen && (
          <>
            <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
            <div className="menu" role="menu">
              <button type="button" role="menuitem" className="menu-item" onClick={openCamera}>
                <CameraIcon size={22} /> Camera
              </button>
              <button type="button" role="menuitem" className="menu-item" onClick={openGallery}>
                <GalleryIcon size={22} /> Gallery
              </button>
            </div>
          </>
        )}

        <div className="composer">
          <button type="button" className="round-btn" aria-label="Add rack photo" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            <PlusIcon size={22} />
          </button>
          <button type="button" className="composer-text" onClick={() => (draft ? setSheet('review') : setMenuOpen(true))}>
            {draft ? 'Review and send' : 'Add a rack photo'}
          </button>
          <button type="button" className="round-btn round-btn-solid" aria-label="Review and send" disabled={!draft} onClick={() => setSheet('review')}>
            <ArrowUpIcon size={20} />
          </button>
        </div>
      </div>

      {sheet === 'camera' && (
        <CameraView
          onClose={() => setSheet(null)}
          onCapture={(base64) => {
            void runOcr(base64);
          }}
          onUnavailable={() => {
            setSheet(null);
            void pick(CameraSource.Camera);
          }}
        />
      )}

      {sheet === 'review' && draft && <ReviewSheet draft={draft} onChange={patch} onConfirm={confirm} onMinimize={() => setSheet(null)} onDiscard={discard} onPreview={() => setViewer(draft.thumb)} />}

      {viewer && <PhotoViewer src={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
