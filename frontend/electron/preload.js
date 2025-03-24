const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const { app } = require('@electron/remote');

// Get application root path
const appRoot = app.getAppPath();
const resourcePath = process.resourcesPath;

// Function to find asset files in various possible locations
function getAssetPath(assetPath) {
  // Strip leading slash if present
  if (assetPath.startsWith('/')) {
    assetPath = assetPath.substring(1);
  }
  
  // Get just the filename
  const fileName = path.basename(assetPath);
  const assetDir = path.dirname(assetPath);
  
  console.log("Requested asset path:", assetPath);
  
  if (assetDir.includes('models') || assetDir.includes('animations')) {
    console.log("Looking for model file:", fileName);
    
    // Define all possible locations for the asset
    const possibleLocations = [
      // Direct resource paths - check these first (from extraResources)
      path.join(resourcePath, 'models', fileName),
      path.join(resourcePath, 'animations', fileName),
      path.join(resourcePath, assetPath),
      
      // Unpacked paths
      path.join(resourcePath, 'app.asar.unpacked', 'build', assetPath),
      
      // App paths
      path.join(appRoot, 'build', assetPath),
      path.join(appRoot, assetPath),
      
      // Relative paths
      path.join(__dirname, '..', 'build', assetPath),
      path.join(__dirname, '..', assetPath)
    ];
    
    // Check each location
    for (const location of possibleLocations) {
      try {
        if (fs.existsSync(location)) {
          console.log("Found asset at:", location);
          return location;
        }
      } catch (err) {
        console.error("Error checking file existence:", err);
      }
    }
    
    console.log("Model file not found in any location:", fileName);
    return assetPath; 
  }
  
  return assetPath;
}

// Log when preload script is loaded
console.log('Preload script initialized');

// Use contextBridge to expose secured APIs
contextBridge.exposeInMainWorld('electronAPI', {
  // Basic info
  isElectron: true,
  
  // Asset path helper
  getAssetPath: getAssetPath,
  
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
  close: () => ipcRenderer.send('close-window'),
  
  // Backend status check via main process
  checkBackendStatus: async () => {
    return await ipcRenderer.invoke('get-backend-status');
  }
});

// Path information
contextBridge.exposeInMainWorld('electron', {
  isPackaged: app.isPackaged,
  appPath: appRoot,
  currentDir: __dirname,
  dirName: path.basename(__dirname)
});

