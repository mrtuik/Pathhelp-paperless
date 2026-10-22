import { useState } from 'react';
import { XIcon } from './Icons';

interface Props {
  src: string;
  onClose: () => void;
}

/** Full-screen photo preview. Tap the photo to zoom in/out (drag to look around when zoomed). */
export function PhotoViewer({ src, onClose }: Props) {
  const [zoom, setZoom] = useState(false);
  return (
    <div className="viewer" role="dialog" aria-label="Photo preview" onClick={onClose}>
      <button type="button" className="viewer-close" aria-label="Close preview" onClick={onClose}>
        <XIcon size={22} />
      </button>
      <div className="viewer-scroll">
        <img
          className={`viewer-img${zoom ? ' viewer-zoom' : ''}`}
          src={src}
          alt="Rack photo"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => !z);
          }}
        />
      </div>
      <div className="viewer-hint">{zoom ? 'Tap to fit' : 'Tap photo to zoom'}</div>
    </div>
  );
}
