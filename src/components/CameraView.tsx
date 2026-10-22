import { useEffect, useRef, useState } from 'react';
import { videoFrameToJpegBase64 } from '../image';
import { BoltIcon, XIcon } from './Icons';

interface Props {
  onCapture: (imageBase64: string) => void;
  onClose: () => void;
  /** Called when the live camera cannot start (permission denied, no support). */
  onUnavailable: (reason: string) => void;
}

type TorchCaps = MediaTrackCapabilities & { torch?: boolean };

/** Half-screen camera in a bottom sheet: live preview, shutter, close, optional torch. */
export function CameraView({ onCapture, onClose, onUnavailable }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const callbacks = useRef({ onClose, onUnavailable });
  callbacks.current = { onClose, onUnavailable };
  const [ready, setReady] = useState(false);
  const [canTorch, setCanTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Start / stop the camera stream.
  useEffect(() => {
    let cancelled = false;
    const stop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Live camera is not available.');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 3840 }, height: { ideal: 2160 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        const caps = stream.getVideoTracks()[0]?.getCapabilities() as TorchCaps | undefined;
        setCanTorch(Boolean(caps?.torch));
        setReady(true);
      } catch (e) {
        if (!cancelled) callbacks.current.onUnavailable(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  // Android back button closes the camera (one history entry while it is open).
  useEffect(() => {
    history.pushState({ camera: true }, '');
    const onPop = () => callbacks.current.onClose();
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if ((history.state as { camera?: boolean } | null)?.camera) history.back();
    };
  }, []);

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !ready || video.videoWidth === 0) return;
    try {
      onCapture(videoFrameToJpegBase64(video));
    } catch (e) {
      callbacks.current.onUnavailable(e instanceof Error ? e.message : String(e));
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setCanTorch(false);
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="cam-sheet" role="dialog" aria-label="Camera" onClick={(e) => e.stopPropagation()}>
        <video ref={videoRef} className="cam-video" playsInline muted autoPlay />
        <div className="cam-top">
          <button type="button" className="cam-btn" aria-label="Close camera" onClick={onClose}>
            <XIcon size={22} />
          </button>
          <span className="cam-hint">Fit the rack screen in the frame</span>
          {canTorch ? (
            <button type="button" className={`cam-btn${torchOn ? ' cam-btn-on' : ''}`} aria-label="Torch" aria-pressed={torchOn} onClick={() => void toggleTorch()}>
              <BoltIcon size={20} />
            </button>
          ) : (
            <span className="cam-btn cam-btn-empty" />
          )}
        </div>
        <div className="cam-bottom">
          <button type="button" className="shutter" aria-label="Take photo" onClick={shoot} disabled={!ready} />
        </div>
      </div>
    </div>
  );
}
