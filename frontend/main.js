const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { initialize } = require('@electron/remote/main');

// Basic logging
console.log('Electron app starting');
console.log('__dirname:', __dirname);

// Global reference to prevent window from being garbage collected
let mainWindow;

// Initialize app when ready
app.whenReady().then(() => {
  initialize(); // Initialize remote module
  createWindow();
});

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Disable sandbox to allow Node modules in preload
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: process.env.NODE_ENV === 'development' ? false : true
    }
  });

  // Update the CSP configuration
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' blob:; " +
          "script-src 'self' blob: 'unsafe-eval' 'wasm-unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "worker-src blob: 'self'; " +
          "connect-src 'self' blob: http://localhost:8000 ws://localhost:8000; " + // Add backend API and WebSocket
          "img-src 'self' data: blob:;"
        ]
      }
    });
  });

  // Add this after creating mainWindow
  mainWindow.webContents.on('did-finish-load', () => {
    // Make sure URLs in the window are treated as in-app navigation
    // instead of loading new pages
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith('http')) {
        event.preventDefault();
      }
    });

    // After loading the window, inject a base tag and configure for hash-based routing
    mainWindow.webContents.executeJavaScript(`
      // Add base URL to help resolve relative paths
      const base = document.createElement('base');
      base.href = './';
      document.head.appendChild(base);
      
      // Help React Router understand we're in a file context
      window.isElectron = true;
      
      console.log('Base URL injected for proper routing');
    `);
  });

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, 'build/index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle window control IPC events
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Re-create window if needed when app is activated
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});