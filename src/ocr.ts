import { registerPlugin } from '@capacitor/core';

interface MlkitOcrPlugin {
  recognize(options: { image: string }): Promise<{ text: string }>;
}

// Native plugin (Google ML Kit Text Recognition, bundled model: works offline).
const MlkitOcr = registerPlugin<MlkitOcrPlugin>('MlkitOcr');

/** Reads all text from a JPEG (base64, no data: prefix) on the device. */
export async function recognizeText(imageBase64: string): Promise<string> {
  try {
    const res = await MlkitOcr.recognize({ image: imageBase64 });
    return res.text ?? '';
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`Could not read the photo on this device: ${m}`);
  }
}
