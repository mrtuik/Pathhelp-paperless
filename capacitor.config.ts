import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pathhelp.paperless',
  appName: 'Pathhelp Paperless',
  webDir: 'dist',
  plugins: {
    // Route fetch()/XHR through native HTTP: no CORS, redirects (Apps Script 302) are followed.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
