export interface Size {
  width: number;
  height: number;
}

/** Scales (w,h) down so the longest side is at most `max`. Never upscales. */
export function fitSize(w: number, h: number, max: number): Size {
  const longest = Math.max(w, h);
  if (longest <= max) return { width: w, height: h };
  const k = max / longest;
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
}

export function stripDataUrlPrefix(s: string): string {
  const i = s.indexOf(',');
  return s.startsWith('data:') && i >= 0 ? s.slice(i + 1) : s;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not open the photo.'));
    img.src = src;
  });
}

/** Loads a photo, downsizes it (longest side <= max) and returns JPEG base64 without the data: prefix. */
export async function downscaleToJpegBase64(src: string, max = 1800, quality = 0.85): Promise<string> {
  const img = await loadImage(src);
  const { width, height } = fitSize(img.naturalWidth, img.naturalHeight, max);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process the photo.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return stripDataUrlPrefix(canvas.toDataURL('image/jpeg', quality));
}
