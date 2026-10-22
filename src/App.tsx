import { useCallback, useEffect, useRef, useState } from 'react';
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
      <header className="header">Paperless entry</header>
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
      <nav className="tabbar">
        <button type="button" className={`tabbtn${tab === 'photo' ? ' tabbtn-active' : ''}`} onClick={() => setTab('photo')}>
          <CameraIcon />
          <span>Photo</span>
        </button>
        <button type="button" className={`tabbtn${tab === 'list' ? ' tabbtn-active' : ''}`} onClick={() => setTab('list')}>
          <ListIcon />
          <span>List</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return isTokenMissing() ? <ConfigError /> : <Main />;
}
