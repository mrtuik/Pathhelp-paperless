import { Clipboard } from '@capacitor/clipboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function copyText(text: string): Promise<void> {
  try {
    await Clipboard.write({ string: text });
  } catch {
    await navigator.clipboard.writeText(text);
  }
}

export async function tick(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* no haptics: ignore */
  }
}
