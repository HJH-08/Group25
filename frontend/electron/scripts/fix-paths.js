const fs = require('fs');
const path = require('path');

console.log('Starting fix-paths.js...');

// Read the index.html file
const indexPath = path.join(__dirname, '..', '..', 'build', 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Replace all absolute paths with relative paths
htmlContent = htmlContent.replace(/href="\//g, 'href="./');
htmlContent = htmlContent.replace(/src="\//g, 'src="./');

// Remove any existing base tag first
htmlContent = htmlContent.replace(/<base[^>]*>/g, '');

// Add a single base tag at build time
htmlContent = htmlContent.replace('<head>', '<head>\n  <base href="./" />');

// Add a debug comment at the top
htmlContent = `<!-- Fixed paths for Electron: ${new Date().toISOString()} -->\n${htmlContent}`;

// Write back to the file
fs.writeFileSync(indexPath, htmlContent);

console.log('Fixed paths in index.html');

// Copy electron.js and preload.js to build directory if they don't exist
const electronProdPath = path.join(__dirname, '..', 'electron-prod.js');
const preloadPath = path.join(__dirname, '..', 'preload.js');
const electronjsDestPath = path.join(__dirname, '..', '..', 'build', 'electron.js');
const preloadjsDestPath = path.join(__dirname, '..', '..', 'build', 'preload.js');

// Copy electron-prod.js to build/electron.js
if (!fs.existsSync(electronjsDestPath)) {
  console.log('electron.js not found in build directory, copying now...');
  if (fs.existsSync(electronProdPath)) {
    fs.copyFileSync(electronProdPath, electronjsDestPath);
    console.log('Copied electron-prod.js to build/electron.js');
  } else {
    console.error('ERROR: electron-prod.js not found in project directory');
  }
} else {
  console.log('electron.js is in the correct location');
}

// Copy preload.js to build folder
if (!fs.existsSync(preloadjsDestPath)) {
  console.log('preload.js not found in build directory, copying now...');
  if (fs.existsSync(preloadPath)) {
    fs.copyFileSync(preloadPath, preloadjsDestPath);
    console.log('Copied preload.js to build/preload.js');
  } else {
    console.error('ERROR: preload.js not found in project directory');
  }
} else {
  console.log('preload.js is in the correct location');
}

// Copy loading.html to build directory
const loadingHtmlPath = path.join(__dirname, '..', 'templates', 'loading.html');
const loadingHtmlDestPath = path.join(__dirname, '..', '..', 'build', 'loading.html');

// Copy loading.html to build directory
if (!fs.existsSync(loadingHtmlDestPath)) {
  console.log('loading.html not found in build directory, copying now...');
  fs.copyFileSync(loadingHtmlPath, loadingHtmlDestPath);
  console.log('Copied loading.html to build directory');
} else {
  console.log('loading.html already exists in build directory');
}

// Additional check to verify they're now there
console.log('Final check:');
console.log('- electron.js exists in build:', fs.existsSync(electronjsDestPath));
console.log('- preload.js exists in build:', fs.existsSync(preloadjsDestPath));
console.log('- index.html exists in build:', fs.existsSync(indexPath));
console.log('- loading.html exists in build:', fs.existsSync(loadingHtmlDestPath));

console.log('fix-paths.js completed');