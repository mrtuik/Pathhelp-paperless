import { useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { lotTotals, nextPending, orderLots, rackTotals } from '../lots';
import type { Item, Lot } from '../types';
import { api } from '../api';
import { plural } from '../chat';
import { copyText, tick } from '../native';
import { BottomSheet } from './BottomSheet';
import { CheckIcon, CopyIcon, MoreIcon, RefreshIcon, UndoIcon } from './Icons';
import { DeleteSheet, EditLotSheet, EditRackSheet, ManageMenu } from './ManageSheets';
import { SegmentedControl } from './SegmentedControl';
import { Slot } from './Slot';

interface Props {
  lots: Lot[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setDone: (lotId: number, id: string, done: boolean) => Promise<void>;
  selectedLotId: number | null;
  onSelectLot: (id: number) => void;
  notify: (message: string) => void;
}

const PULL_TRIGGER = 56;

/** What is being managed: the whole lot, or one rack (by number), and which step is open. */
interface Manage {
  target: 'lot' | number;
  step: 'menu' | 'edit' | 'delete';
}

const friendly = (e: unknown): string => {
  const m = e instanceof Error ? e.message : String(e);
  return /unknown action/i.test(m) ? 'The Google script is not updated yet. Paste the new Code.gs and deploy a new version.' : m;
};

export function ListTab({ lots, loading, error, refresh, setDone, selectedLotId, onSelectLot, notify }: Props) {
  const ordered = orderLots(lots);
  const lot = ordered.find((l) => l.id === selectedLotId) ?? ordered[ordered.length - 1] ?? null;
  const [sheetItem, setSheetItem] = useState<Item | null>(null);
  const [manage, setManage] = useState<Manage | null>(null);
  const [busy, setBusy] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);

  // pull to refresh
  const scroller = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);

  const onTouchStart = (e: TouchEvent) => {
    startY.current = (scroller.current?.scrollTop ?? 1) <= 0 ? e.touches[0]!.clientY : null;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0]!.clientY - startY.current;
    setPull(dy > 0 ? Math.min(dy * 0.5, 80) : 0);
  };
  const onTouchEnd = () => {
    if (pull >= PULL_TRIGGER && !loading) void refresh();
    startY.current = null;
    setPull(0);
  };

  const copy = async (id: string) => {
    try {
      await copyText(id);
      void tick();
      notify(`Copied ${id}`);
    } catch {
      notify('Could not copy');
    }
  };

  const toggleDone = async (item: Item, done: boolean) => {
    if (!lot) return;
    setSheetItem(null);
    try {
      await setDone(lot.id, item.id, done);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not update');
    }
  };

  const openManage = (target: 'lot' | number) => {
    setManageError(null);
    setManage({ target, step: 'menu' });
  };
  const closeManage = () => {
    if (!busy) setManage(null);
  };
  const run = async (task: () => Promise<void>, doneMessage: string) => {
    setBusy(true);
    setManageError(null);
    try {
      await task();
      setManage(null);
      notify(doneMessage);
      await refresh();
    } catch (e) {
      setManageError(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const managedRack = lot && manage && manage.target !== 'lot' ? lot.racks.find((r) => r.rack === manage.target) ?? null : null;

  const totals = lot ? lotTotals(lot) : { done: 0, total: 0 };
  const next = lot ? nextPending(lot) : null;

  return (
    <div className="tab">
      <div className="topbar">
        <SegmentedControl segments={ordered.map((l) => ({ value: l.id, label: `Lot ${l.id}` }))} value={lot?.id ?? null} onChange={onSelectLot} />
        <button type="button" className="icon-btn" aria-label="Lot options" onClick={() => openManage('lot')} disabled={!lot}>
          <MoreIcon />
        </button>
        <button type="button" className="icon-btn" aria-label="Refresh" onClick={() => void refresh()} disabled={loading}>
          <span className={loading ? 'spin' : undefined}>
            <RefreshIcon />
          </span>
        </button>
      </div>

      <div ref={scroller} className="scroll" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div className="ptr" style={{ height: loading ? 36 : pull }}>
          {(loading || pull > 0) && <span className="muted small">{loading ? 'Refreshing…' : pull >= PULL_TRIGGER ? 'Release to refresh' : 'Pull to refresh'}</span>}
        </div>

        {error && <div className="banner banner-error">{error}</div>}

        {!lot ? (
          <div className="empty">{loading ? 'Loading…' : 'No lots yet. Take a rack photo to get started.'}</div>
        ) : (
          <>
            <div className="now-card">
              <div className="now-main">
                <div className="now-label">NOW</div>
                {next ? (
                  <>
                    <div className="now-id mono">{next.id}</div>
                    <div className="now-sub">
                      Rack {next.rack} · slot {next.slot}
                    </div>
                  </>
                ) : (
                  <div className="now-id">{totals.total ? 'All done' : 'Empty lot'}</div>
                )}
              </div>
              <div className="now-progress">
                <div className="now-count mono">
                  {totals.done}/{totals.total}
                </div>
                <div className="now-bar">
                  <div className="now-bar-fill" style={{ width: totals.total ? `${(totals.done / totals.total) * 100}%` : '0%' }} />
                </div>
              </div>
            </div>

            {lot.racks.map((r) => {
              const t = rackTotals(r);
              return (
                <section key={r.rack} className="rack">
                  <h2 className="rack-title">
                    <span>Rack {r.rack}</span>
                    <span className="rack-tools">
                      <span className="rack-count mono">
                        {t.done}/{t.total}
                      </span>
                      <button type="button" className="mini-btn" aria-label={`Rack ${r.rack} options`} onClick={() => openManage(r.rack)}>
                        <MoreIcon size={18} />
                      </button>
                    </span>
                  </h2>
                  <div className="grid">
                    {r.items.map((item, i) => (
                      <Slot key={item.id} index={i + 1} item={item} onTap={setSheetItem} onLongPress={(it) => void copy(it.id)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>

      <BottomSheet open={sheetItem !== null} title={sheetItem?.id ?? ''} onClose={() => setSheetItem(null)}>
        {sheetItem && (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                void copy(sheetItem.id);
                setSheetItem(null);
              }}
            >
              <CopyIcon /> Copy PT number
            </button>
            {sheetItem.done ? (
              <button type="button" className="btn btn-secondary" onClick={() => void toggleDone(sheetItem, false)}>
                <UndoIcon /> Undo done
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => void toggleDone(sheetItem, true)}>
                <CheckIcon /> Mark done
              </button>
            )}
          </>
        )}
      </BottomSheet>

      {lot && manage && manage.target === 'lot' && manage.step === 'menu' && (
        <ManageMenu title={`Lot ${lot.id}`} onEdit={() => setManage({ target: 'lot', step: 'edit' })} onDelete={() => setManage({ target: 'lot', step: 'delete' })} onClose={closeManage} />
      )}
      {lot && manage && manage.target === 'lot' && manage.step === 'edit' && (
        <EditLotSheet
          lot={lot.id}
          busy={busy}
          error={manageError}
          onClose={closeManage}
          onSave={(n) =>
            void run(async () => {
              await api.editLot(lot.id, n);
              onSelectLot(n);
            }, `Lot ${lot.id} is now Lot ${n}`)
          }
        />
      )}
      {lot && manage && manage.target === 'lot' && manage.step === 'delete' && (
        <DeleteSheet
          title={`Delete Lot ${lot.id}?`}
          text={`This removes ${plural(totals.total, 'PT number')} in ${plural(lot.racks.length, 'rack')} from the Google Sheet. It cannot be undone.`}
          busy={busy}
          error={manageError}
          onClose={closeManage}
          onConfirm={() => void run(() => api.deleteLot(lot.id), `Lot ${lot.id} deleted`)}
        />
      )}

      {lot && managedRack && manage && manage.step === 'menu' && (
        <ManageMenu
          title={`Rack ${managedRack.rack}`}
          onEdit={() => setManage({ target: managedRack.rack, step: 'edit' })}
          onDelete={() => setManage({ target: managedRack.rack, step: 'delete' })}
          onClose={closeManage}
        />
      )}
      {lot && managedRack && manage && manage.step === 'edit' && (
        <EditRackSheet
          lot={lot.id}
          rack={managedRack.rack}
          initialIds={managedRack.items.map((it) => it.id)}
          busy={busy}
          error={manageError}
          onClose={closeManage}
          onSave={(newRack, ids) => void run(() => api.editRack(lot.id, managedRack.rack, newRack, ids), `Rack ${newRack} saved`)}
        />
      )}
      {lot && managedRack && manage && manage.step === 'delete' && (
        <DeleteSheet
          title={`Delete Rack ${managedRack.rack}?`}
          text={`This removes ${plural(managedRack.items.length, 'PT number')} of Rack ${managedRack.rack} from Lot ${lot.id} in the Google Sheet. It cannot be undone.`}
          busy={busy}
          error={manageError}
          onClose={closeManage}
          onConfirm={() => void run(() => api.deleteRack(lot.id, managedRack.rack), `Rack ${managedRack.rack} deleted`)}
        />
      )}
    </div>
  );
}
