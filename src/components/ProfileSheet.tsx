import { useState } from 'react';
import { GITHUB_USER, PROFILE_NAME } from '../config';
import { BottomSheet } from './BottomSheet';
import { Avatar } from './Avatar';
import { TrashIcon } from './Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  onReset: () => void;
}

/** Profile (GitHub photo + name) first, then the manual "Reset lots" option. */
export function ProfileSheet({ open, onClose, onReset }: Props) {
  const [confirming, setConfirming] = useState(false);
  const close = () => {
    setConfirming(false);
    onClose();
  };
  return (
    <BottomSheet open={open} title="Profile" onClose={close}>
      <div className="profile-card">
        <Avatar size={64} />
        <div className="profile-info">
          <div className="profile-title">{PROFILE_NAME}</div>
          <div className="muted small">@{GITHUB_USER} · GitHub</div>
        </div>
      </div>
      {confirming ? (
        <>
          <p className="delete-text">This hides all current lots and clears the chat on this phone. Nothing is deleted from the Google Sheet.</p>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              onReset();
              close();
            }}
          >
            <TrashIcon size={18} /> Yes, reset lots
          </button>
        </>
      ) : (
        <button type="button" className="btn btn-secondary btn-danger-text" onClick={() => setConfirming(true)}>
          <TrashIcon size={18} /> Reset lots
        </button>
      )}
    </BottomSheet>
  );
}
