import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ListTab } from './components/ListTab';
import { ListIcon, CoffeeIcon } from './components/Icons';
import logoUrl from './assets/logo.png';
import { PhotoTab } from './components/PhotoTab';
import { isTokenMissing } from './config';
import { Avatar } from './components/Avatar';
import { ProfileSheet } from './components/ProfileSheet';
import type { SaveResult } from './types';
import { useLots } from './useLots';

type Tab = 'photo' | 'list';

function ConfigError() {
  return (
    <div className="center-fill pad">
      <h1 className="title">Setup needed</h1>
      <p>
        The access token is not set. Open <code className="mono">src/config.ts</code>, replace <code className="mono">PASTE_TOKEN_HERE</code> with your token, then push to GitHub to build a new APK.
      </p>
    </div>
  );
}

function Main() {
  const [tab, setTab] = useState<Tab>('photo');
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const { lots, loading, error, refresh, setDone, resetAt, resetLots } = useLots();
  const [profileOpen, setProfileOpen] = useState(false);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const onSaved = (res: SaveResult) => {
    setSelectedLotId(res.lot);
    void refresh(true);
  };

  return (
    <div className="app">
      <header className="header">
        <span className="hdr-side" aria-hidden="true" />
        <div className="hdr-center">
          <img className="logo" src={logoUrl} alt="" aria-hidden="true" />
          <span className="brand-name">Paperless entry</span>
        </div>
        <button type="button" className="hdr-btn" aria-label="Profile" onClick={() => setProfileOpen(true)}>
          <Avatar size={44} />
        </button>
      </header>
      <main className="main">
        <div className="pane" hidden={tab !== 'photo'}>
          <PhotoTab onSaved={onSaved} resetAt={resetAt} />
        </div>
        <div className="pane" hidden={tab !== 'list'}>
          <ListTab
            lots={lots}
            loading={loading}
            refresh={() => refresh()}
            error={error}
            setDone={setDone}
            selectedLotId={selectedLotId}
            onSelectLot={setSelectedLotId}
            notify={notify}
          />
        </div>
      </main>
      {toast && <div className="toast">{toast}</div>}
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onReset={() => { resetLots(); notify('Lots reset'); }} />
      <div className="navroot">
        <nav className="bnav" style={{ '--i': tab === 'photo' ? 0 : 1 } as CSSProperties}>
          <span className="ind" aria-hidden="true" />
          <button type="button" aria-label="Photo" className={tab === 'photo' ? 'on' : ''} onClick={() => setTab('photo')}>
            <CoffeeIcon size={22} />
          </button>
          <button type="button" aria-label="List" className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>
            <ListIcon size={28} />
          </button>
        </nav>
        <span className={`refresh-note${loading ? ' on' : ''}`} role="status" aria-live="polite">
          {loading ? 'Refreshing…' : ''}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return isTokenMissing() ? <ConfigError /> : <Main />;
}
