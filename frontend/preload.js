const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// Log when preload script is loaded
console.log('Preload script initialized');

// Use contextBridge to expose secured APIs
contextBridge.exposeInMainWorld('electronAPI', {
  // Basic info
  isElectron: true,
  
  // Asset path helper with improved model paths
  getAssetPath: (assetPath) => {
    console.log('Requested asset path:', assetPath);
    
    // Handle model paths specifically
    if (assetPath.startsWith('/models/')) {
      const fileName = path.basename(assetPath);
      console.log('Looking for model file:', fileName);
      
      // Try multiple possible locations
      const possiblePaths = [
        path.join(__dirname, 'build', 'models', fileName),
        path.join(__dirname, 'public', 'models', fileName),
        path.join(__dirname, 'models', fileName),
        path.join(__dirname, assetPath),
        path.join(__dirname, assetPath.slice(1)),
        path.join(__dirname, 'build', assetPath.slice(1)),
        path.join(__dirname, 'public', assetPath.slice(1)),
        path.join(process.cwd(), 'build', 'models', fileName),
        path.join(process.cwd(), 'public', 'models', fileName)
      ];
      
      for (const possiblePath of possiblePaths) {
        console.log('Checking path:', possiblePath);
        if (fs.existsSync(possiblePath)) {
          console.log('Found model at:', possiblePath);
          return possiblePath;
        }
      }
      
      console.error('Model file not found in any location:', fileName);
      // Return a path anyway, even if it doesn't exist
      return path.join(__dirname, 'build', 'models', fileName);
    }
    
    // Default path handling
    if (assetPath.startsWith('/')) {
      return `.${assetPath}`;
    }
    return assetPath;
  },
  
  // File existence check helper
  fileExists: (filePath) => {
    try {
      return fs.existsSync(filePath);
    } catch (err) {
      console.error('Error checking if file exists:', err);
      return false;
    }
  },
  
  // Window control functions
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window')
});

// Path information
contextBridge.exposeInMainWorld('electron', {
  isPackaged: process.env.NODE_ENV === 'production',
  appPath: __dirname,
  currentDir: __dirname,
  dirName: path.basename(__dirname)
});

