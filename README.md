# Pathhelp Paperless

Take a photo of the Horiba rack screen. The app reads the PT numbers (for example `261022PT150`), lets you fix them, saves them to your Google Sheet, and shows the saved list (Lot, Rack, slots). Submitted PTs are struck through.

React 18 + Vite + TypeScript + Capacitor 6. The backend is your existing Google Apps Script web app (nothing to host).

**OCR runs on the phone** (Google ML Kit text recognition, bundled model). It works offline and has no usage limit. The app reads the PT numbers and rack number itself, then only `list`, `done` and `save` talk to Apps Script. The Drive API service and the `ocr` action are no longer needed.

## 1. The token

The token lives in `src/config.ts`:

```ts
export const SCRIPT_URL = '...';   // already set
export const TOKEN: string = '...'; // your Apps Script token
```

It is read from the Apps Script execution log after you run `setup()` ("YOUR TOKEN: ..."). If it is still `PASTE_TOKEN_HERE`, the app shows a setup screen instead of the tabs.

Anyone who has the APK can extract the token, and anyone who has the token can use your script. Keep the repo **private** and only share the APK with your team.

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "Pathhelp Paperless"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## 3. Build the APK

The workflow `.github/workflows/build-apk.yml` runs on every push to `main`, or manually: **Actions → Build APK → Run workflow**.

First run only: it creates the `android/` folder (`npx cap add android`), patches it (portrait, minSdk 24, camera permission, icon, splash) and commits `android/` plus `package-lock.json` back to `main` with `[skip ci]`. Run `git pull` before your next push.

Steps: install, `npm test`, `npm run build`, `cap sync`, `./gradlew assembleDebug`, upload artifact.

## 4. Download and install

1. Open the finished workflow run on GitHub.
2. Open the repo **Releases** page, find the newest `build-N` release and download `pathhelp-debug.apk`.
3. Copy the APK to the phone, open it, and allow "Install unknown apps" when asked.

## 5. Optional: signed release APK

Create a keystore once (keep the file and passwords safe, you need the same key for every update):

```bash
keytool -genkeypair -v -keystore release.keystore -alias pathhelp \
  -keyalg RSA -keysize 2048 -validity 10000
```

Convert it to base64:

```bash
base64 -w 0 release.keystore > keystore.b64     # Linux
base64 -i release.keystore -o keystore.b64      # macOS
```

On GitHub open **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value |
| --- | --- |
| `KEYSTORE_BASE64` | contents of `keystore.b64` |
| `KEYSTORE_PASSWORD` | the keystore password |
| `KEY_ALIAS` | `pathhelp` (the alias you used) |
| `KEY_PASSWORD` | the key password |

When all four exist, the workflow also builds, aligns and signs a release APK and uploads it as `pathhelp-release-apk`. If any is missing, that part is skipped.

## Backend API used (nothing else)

- `GET ?action=list&token=...`
- `GET ?action=done&id=...&value=1|0&token=...`
- `POST` (`Content-Type: text/plain`) `save`

`CapacitorHttp` is enabled in `capacitor.config.ts`, so requests go through native HTTP: no CORS, and the Apps Script 302 redirect is followed.

## Local development

```bash
npm install
npm test
npm run dev      # browser preview (camera and native HTTP only work on the phone)
```

## Notes

- Lot picker shows lots oldest to newest. Tap, or drag a finger across and release. If there are many lots it scrolls sideways (tap still works).
- NOW card = the first slot not yet done, in rack order.
- Tap a slot for the Copy / Mark done / Undo done sheet. Long-press copies straight away.
- Fonts: JetBrains Mono (SIL OFL, see `src/assets/fonts/JetBrainsMono-OFL.txt`).

## On-device OCR (how it is wired)

- `resources/native/MlkitOcrPlugin.java` is a small Capacitor plugin around ML Kit. `scripts/patch-android.mjs` copies it into `android/`, registers it in `MainActivity.java` and adds `com.google.mlkit:text-recognition` to `android/app/build.gradle` on every build.
- `src/ocr.ts` calls the plugin, `src/parse.ts` turns the text into PT numbers and the rack number (same rules as the old Apps Script parser, with unit tests).
- Tips for good reads: hold the phone straight at the screen, fill the frame, avoid glare. You can always fix the numbers before saving.

## Look and flow (chat style)

- Theme matches the Pathhelp extension: shadcn/ui zinc look, lucide-style icons, white tab bar, white status bar and black NOW card (white theme). Gallery and List icons are the supplied artwork.
- The Photo tab is a chat, like ChatGPT. Tap **+** in the message box and choose **Camera** or **Gallery**.
- **Camera** opens as a half-screen sheet (live preview, shutter, close, torch). If the live camera cannot start, the app falls back to the phone's camera app.
- After the photo is taken or picked, a bottom sheet shows the rack number and the PT numbers it read (tap Edit to fix them). **Confirm** sends them to the Google Sheet.
- Closing the sheet keeps the photo attached above the message box; the arrow button reopens it. Discard removes it.
- The reply in the chat says which rack was uploaded to which Lot, how many PT numbers were added or updated, lists the selected PT numbers, and shows the racks uploaded so far in that Lot. A failed upload shows Retry.
- Chat history (last 40 messages, small photo previews) is kept on the phone.
- App icon, splash and the empty-screen glyph come from `resources/paper-glyph.png`.
