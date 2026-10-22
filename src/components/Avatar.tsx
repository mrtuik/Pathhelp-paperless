import { useState } from 'react';
import { GITHUB_USER, PROFILE_NAME } from '../config';

/** GitHub profile photo; falls back to the first letter when offline. */
export function Avatar({ size }: { size: number }) {
  const [failed, setFailed] = useState(false);
  const px = Math.round(size * 3);
  return failed ? (
    <span className="avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      {PROFILE_NAME.trim().charAt(0).toUpperCase()}
    </span>
  ) : (
    <img className="avatar-img" style={{ width: size, height: size }} src={`https://github.com/${GITHUB_USER}.png?size=${px}`} alt="" onError={() => setFailed(true)} />
  );
}
