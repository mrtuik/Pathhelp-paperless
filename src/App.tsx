import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ListTab } from './components/ListTab';
import { ListIcon, CameraIcon } from './components/Icons';
import { PhotoTab } from './components/PhotoTab';
import { isTokenMissing } from './config';
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
  const { lots, loading, error, refresh, setDone } = useLots();

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
        <span className="logo" aria-hidden="true">
          <span className="logo-glyph" />
        </span>
        <span className="brand-name">Paperless entry</span>
      </header>
      <main className="main">
        <div className="pane" hidden={tab !== 'photo'}>
          <PhotoTab onSaved={onSaved} />
        </div>
        <div className="pane" hidden={tab !== 'list'}>
          <ListTab
            lots={lots}
            loading={loading}
            error={error}
            refresh={() => refresh()}
            setDone={setDone}
            selectedLotId={selectedLotId}
            onSelectLot={setSelectedLotId}
            notify={notify}
          />
        </div>
      </main>
      {toast && <div className="toast">{toast}</div>}
      <div className="navroot">
        <nav className="bnav" style={{ '--i': tab === 'photo' ? 0 : 1 } as CSSProperties}>
          <span className="ind" aria-hidden="true" />
          <button type="button" aria-label="Photo" className={tab === 'photo' ? 'on' : ''} onClick={() => setTab('photo')}>
            <CameraIcon size={22} />
          </button>
          <button type="button" aria-label="List" className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>
            <ListIcon size={28} />
          </button>
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return isTokenMissing() ? <ConfigError /> : <Main />;
}
