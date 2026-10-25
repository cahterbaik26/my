/**
 * Web2App Builder - Minimal Secure Preload Script
 * Strictly isolates Electron APIs and exposes only essential diagnostics
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('web2app', {
  platform: process.platform,
  version: process.versions.electron,
  retryLoad: () => ipcRenderer.send('web2app:retry-navigation'),
});
