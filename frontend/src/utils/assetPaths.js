/**
 * Returns the correct path for assets depending on environment (Electron vs browser)
 * @param {string} assetPath - The original asset path (e.g. "/models/avatar.glb")
 * @returns {string} - The corrected path for the current environment
 */
export const getAssetPath = (assetPath) => {
  // First try to use the electronAPI if available
  if (window.electronAPI && typeof window.electronAPI.getAssetPath === 'function') {
    console.log('Using Electron API for asset path:', assetPath);
    return window.electronAPI.getAssetPath(assetPath);
  }
  
  // Fallback for browser or if electronAPI is unavailable
  console.log('Using browser fallback for asset path:', assetPath);
  if (assetPath.startsWith('/')) {
    return `.${assetPath}`;
  }
  
  return assetPath;
};

/**
 * Checks if a file exists (only works in Electron)
 * @param {string} filePath - Path to check
 * @returns {boolean} - Whether the file exists
 */
export const fileExists = (filePath) => {
  if (window.electronAPI && typeof window.electronAPI.fileExists === 'function') {
    return window.electronAPI.fileExists(filePath);
  }
  // In browser context, we can't check if files exist
  return true;
};

