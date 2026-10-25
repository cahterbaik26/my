/**
 * Web2App Builder - Secure Electron Main Process
 * Generated for production desktop deployment
 */

import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Load embedded project configuration
interface AppRuntimeConfig {
  websiteUrl: string;
  applicationName: string;
  applicationId: string;
  applicationVersion: string;
  window: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
    resizable: boolean;
    fullscreen: boolean;
    showMenuBar: boolean;
    backgroundColor: string;
  };
  security: {
    httpsOnly: boolean;
    externalLinkPolicy: 'system-browser' | 'same-window' | 'blocked';
    allowedDomains: string[];
    allowPrivateNetworkTargets: boolean;
  };
}

let config: AppRuntimeConfig = {
  websiteUrl: 'https://example.com',
  applicationName: 'Web2App Desktop',
  applicationId: 'com.example.app',
  applicationVersion: '1.0.0',
  window: {
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    fullscreen: false,
    showMenuBar: false,
    backgroundColor: '#0f172a',
  },
  security: {
    httpsOnly: true,
    externalLinkPolicy: 'system-browser',
    allowedDomains: [],
    allowPrivateNetworkTargets: false,
  },
};

// Try loading app-config.json if provided
try {
  const configPath = path.join(__dirname, '..', 'app-config.json');
  if (fs.existsSync(configPath)) {
    const rawData = fs.readFileSync(configPath, 'utf-8');
    config = { ...config, ...JSON.parse(rawData) };
  }
} catch (err) {
  console.warn('Could not load custom app-config.json, using defaults:', err);
}

let mainWindow: BrowserWindow | null = null;

function isAllowedHost(urlStr: string): boolean {
  try {
    const targetUrl = new URL(urlStr);
    const mainUrl = new URL(config.websiteUrl);

    // Same host is always allowed
    if (targetUrl.hostname === mainUrl.hostname) {
      return true;
    }

    // Subdomains of the main host
    if (targetUrl.hostname.endsWith('.' + mainUrl.hostname)) {
      return true;
    }

    // Additional explicitly allowed domains
    if (config.security.allowedDomains && config.security.allowedDomains.length > 0) {
      return config.security.allowedDomains.some((domain) => {
        const cleanDomain = domain.trim().toLowerCase();
        return (
          targetUrl.hostname.toLowerCase() === cleanDomain ||
          targetUrl.hostname.toLowerCase().endsWith('.' + cleanDomain)
        );
      });
    }

    return false;
  } catch {
    return false;
  }
}

function createWindow(): void {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    title: config.applicationName,
    width: config.window.width || 1280,
    height: config.window.height || 800,
    minWidth: config.window.minWidth || 800,
    minHeight: config.window.minHeight || 600,
    resizable: config.window.resizable ?? true,
    fullscreen: config.window.fullscreen ?? false,
    backgroundColor: config.window.backgroundColor || '#0f172a',
    autoHideMenuBar: !config.window.showMenuBar,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      webviewTag: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  if (!config.window.showMenuBar) {
    mainWindow.setMenuBarVisibility(false);
  }

  // 1. Navigation Security: will-navigate
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);

      // Block dangerous protocol schemes
      if (['javascript:', 'data:', 'file:', 'vbscript:'].includes(parsedUrl.protocol)) {
        event.preventDefault();
        console.warn(`Blocked dangerous navigation attempt: ${parsedUrl.protocol}`);
        return;
      }

      // Enforce HTTPS
      if (config.security.httpsOnly && parsedUrl.protocol !== 'https:') {
        event.preventDefault();
        console.warn(`Blocked non-HTTPS navigation: ${navigationUrl}`);
        return;
      }

      // Check external link policy
      if (!isAllowedHost(navigationUrl)) {
        if (config.security.externalLinkPolicy === 'system-browser') {
          event.preventDefault();
          shell.openExternal(navigationUrl);
        } else if (config.security.externalLinkPolicy === 'blocked') {
          event.preventDefault();
          console.warn(`External navigation blocked to: ${navigationUrl}`);
        }
      }
    } catch (e) {
      event.preventDefault();
    }
  });

  // 2. Window Open Security: window.open / target="_blank"
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);

      if (['javascript:', 'data:', 'file:'].includes(parsed.protocol)) {
        return { action: 'deny' };
      }

      if (isAllowedHost(url)) {
        return { action: 'allow' };
      }

      if (config.security.externalLinkPolicy === 'system-browser') {
        shell.openExternal(url);
      }
    } catch {
      // ignore
    }
    return { action: 'deny' };
  });

  // 3. Error handling: display offline fallback if site fails to load
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    // Ignore aborted navigations
    if (errorCode === -3) return;

    console.error(`Page load failed: ${validatedURL} (${errorCode} - ${errorDescription})`);
    const fallbackPath = path.join(__dirname, 'index.html');
    mainWindow?.loadFile(fallbackPath, {
      query: {
        target: validatedURL || config.websiteUrl,
        code: errorCode.toString(),
        desc: errorDescription,
        app: config.applicationName,
      },
    });
  });

  // IPC channel for retry from fallback page
  ipcMain.on('web2app:retry-navigation', () => {
    if (mainWindow) {
      mainWindow.loadURL(config.websiteUrl);
    }
  });

  // Load configured URL
  mainWindow.loadURL(config.websiteUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
