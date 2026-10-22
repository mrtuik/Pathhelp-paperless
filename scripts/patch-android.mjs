// Idempotent tweaks applied to the generated android/ project (safe to run on every build).
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidDir = path.join(root, 'android');
if (!fs.existsSync(androidDir)) {
  console.log('No android/ folder yet, nothing to patch.');
  process.exit(0);
}
const res = path.join(androidDir, 'app/src/main/res');

function edit(file, fn) {
  if (!fs.existsSync(file)) {
    console.warn('Missing file, skipped:', file);
    return;
  }
  const before = fs.readFileSync(file, 'utf8');
  const after = fn(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log('Patched', path.relative(root, file));
  }
}

// Manifest: portrait only + camera permission
edit(path.join(androidDir, 'app/src/main/AndroidManifest.xml'), (x) => {
  if (!/android:screenOrientation=/.test(x)) {
    x = x.replace(/<activity\b/, '<activity\n            android:screenOrientation="portrait"');
  }
  if (!x.includes('android.permission.CAMERA')) {
    x = x.replace(
      /<\/manifest>/,
      '    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n</manifest>',
    );
  }
  return x;
});

// minSdk 24
edit(path.join(androidDir, 'variables.gradle'), (x) => x.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 24'));

// Launcher icon background colour
edit(path.join(res, 'values/ic_launcher_background.xml'), (x) => x.replace(/#[0-9A-Fa-f]{6,8}/, '#0F172A'));

// Icons
const iconSrc = path.join(root, 'resources/android');
if (fs.existsSync(iconSrc)) {
  for (const dir of fs.readdirSync(iconSrc)) {
    const dest = path.join(res, dir);
    fs.mkdirSync(dest, { recursive: true });
    for (const f of fs.readdirSync(path.join(iconSrc, dir))) {
      fs.copyFileSync(path.join(iconSrc, dir, f), path.join(dest, f));
    }
  }
  console.log('Icons copied.');
}

// Splash
const splash = path.join(root, 'resources/splash.png');
if (fs.existsSync(splash) && fs.existsSync(res)) {
  for (const dir of fs.readdirSync(res).filter((d) => d.startsWith('drawable'))) {
    const target = path.join(res, dir, 'splash.png');
    if (fs.existsSync(target)) fs.copyFileSync(splash, target);
  }
  console.log('Splash replaced.');
}

// ---- On-device OCR (Google ML Kit, bundled model) ----
const javaDir = path.join(androidDir, 'app/src/main/java/com/pathhelp/paperless');
const nativeSrc = path.join(root, 'resources/native');
if (fs.existsSync(nativeSrc) && fs.existsSync(javaDir)) {
  for (const f of ['MlkitOcrPlugin.java', 'MainActivity.java']) {
    fs.copyFileSync(path.join(nativeSrc, f), path.join(javaDir, f));
  }
  console.log('Native OCR plugin installed.');
} else {
  console.warn('Could not install native OCR plugin (missing folder):', javaDir);
}

edit(path.join(androidDir, 'app/build.gradle'), (x) => {
  if (x.includes('com.google.mlkit:text-recognition')) return x;
  return x.replace(/\ndependencies\s*\{/, "\ndependencies {\n    implementation 'com.google.mlkit:text-recognition:16.0.1'");
});
