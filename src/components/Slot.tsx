import { useRef } from 'react';
import type { Item } from '../types';
import { CheckIcon } from './Icons';

interface Props {
  index: number;
  item: Item;
  onTap: (item: Item) => void;
  onLongPress: (item: Item) => void;
}

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 10;

export function Slot({ index, item, onTap, onLongPress }: Props) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  const clear = () => {
    if (timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
  };

  return (
    <button
      type="button"
      className={`slot${item.done ? ' slot-done' : ''}`}
      onPointerDown={(e) => {
        fired.current = false;
        origin.current = { x: e.clientX, y: e.clientY };
        clear();
        timer.current = window.setTimeout(() => {
          fired.current = true;
          timer.current = undefined;
          onLongPress(item);
        }, LONG_PRESS_MS);
      }}
      onPointerMove={(e) => {
        if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > MOVE_TOLERANCE) clear();
      }}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (fired.current) {
          fired.current = false;
          return;
        }
        onTap(item);
      }}
    >
      <span className="slot-index">{index}</span>
      <span className="slot-id mono">{item.id}</span>
      {item.done && (
        <span className="slot-check">
          <CheckIcon size={16} />
        </span>
      )}
    </button>
  );
}
