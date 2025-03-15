const fs = require('fs-extra');
const path = require('path');

try {
  console.log('Copying assets for Electron build...');

  // Define source and destination paths
  const publicDir = path.join(__dirname, 'public');
  const buildDir = path.join(__dirname, 'build');
  
  // Array of folders to copy
  const folders = ['animations', 'beeps', 'images', 'videos', 'models'];
  
  // Create build directory if it doesn't exist
  fs.ensureDirSync(buildDir);
  
  // Copy each folder from public to build
  folders.forEach(folder => {
    const srcDir = path.join(publicDir, folder);
    const destDir = path.join(buildDir, folder);
    
    // Skip if source directory doesn't exist
    if (!fs.existsSync(srcDir)) {
      console.log(`Source directory ${srcDir} does not exist. Skipping.`);
      return;
    }
    
    // Create destination directory
    fs.ensureDirSync(destDir);
    
    console.log(`Copying ${folder} from ${srcDir} to ${destDir}`);
    
    // Only copy non-vosk files
    fs.copySync(srcDir, destDir, {
      filter: (src) => {
        const fileName = path.basename(src);
        return !fileName.includes('vosk');
      }
    });
    
    console.log(`${folder} copied successfully!`);
  });
  
  console.log('All assets copied successfully!');
} catch (err) {
  console.error('Error copying assets:', err);
}