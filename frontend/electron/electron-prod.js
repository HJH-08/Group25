const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initialize, enable } = require('@electron/remote/main');
const fs = require('fs');
const { spawn } = require('child_process');
const kill = require('tree-kill');
const http = require('http');

// Path to the log file
const logFile = path.join(app.getPath('userData'), 'companio-log.txt');

// Function to log messages with timestamps
function log(message) {
  const formattedMsg = `[${new Date().toISOString()}] ${message}`;
  console.log(formattedMsg);
  // Also write to file for debugging Finder launches
  fs.appendFileSync(logFile, formattedMsg + '\n');
}

function logError(message) {
  const formattedMsg = `[${new Date().toISOString()}] ERROR: ${message}`;
  console.error(formattedMsg);
  // Also write to file for debugging Finder launches
  fs.appendFileSync(logFile, formattedMsg + '\n');
}

log('Electron app starting in production mode');
log(`__dirname: ${__dirname}`);
log(`app.getAppPath(): ${app.getAppPath()}`);
log(`process.resourcesPath: ${process.resourcesPath}`);
log(`Platform: ${process.platform}`);

// Global reference to prevent window from being garbage collected
let mainWindow;
let backendProcess = null;
let startupTimeout = null;

// Function to initialize the app
function resolveEnvPath(envPath) {
  // Process PATH and ensure it contains critical directories
  const systemPaths = [
    '/local/homebrew/bin',
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin'
  ];
  
  // Split existing path and filter out empty entries
  const existingPaths = (envPath || '')
    .split(':')
    .filter(p => p.trim().length > 0);
  
  // Combine system paths with existing paths, and remove duplicates
  const allPaths = [...new Set([...systemPaths, ...existingPaths])];
  
  // Join paths back with colon
  return allPaths.join(':');
}

// Function to check if backend API is responding
async function checkBackendAPI(port = 8000, retries = 600, delay = 500) {
  log(`Checking if backend API is up on port ${port}...`);
  
  return new Promise((resolve) => {
    let attemptCount = 0;
    
    const checkAPI = () => {
      attemptCount++;
      
      // Calculate time elapsed for logging
      const seconds = Math.floor(attemptCount / 2);
      const minutes = Math.floor(seconds / 60);
      let timeMessage = "";
      
      if (minutes > 0) {
        timeMessage = ` (${minutes}m ${seconds % 60}s elapsed)`;
      } else {
        timeMessage = ` (${seconds}s elapsed)`;
      }
      
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/health', 
        method: 'GET',
        timeout: 1000 
      }, (res) => {
        // Only log the status code
        log(`Backend API responded with status: ${res.statusCode}`);
        
        // Consume the stream to properly close the connection
        res.resume();
        
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          if (attemptCount < retries) {
            setTimeout(checkAPI, delay);
          } else {
            log(`Backend API returned non-200 status after ${retries} attempts (5 minutes)`);
            resolve(false);
          }
        }
      });
      
      req.on('error', (err) => {
        if (attemptCount < retries) {
          log(`Attempt ${attemptCount}/${retries}${timeMessage} - Backend not ready: ${err.message}`);
          setTimeout(checkAPI, delay);
        } else {
          logError(`Backend API check failed after ${retries} attempts (5 minutes): ${err.message}`);
          resolve(false);
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        if (attemptCount < retries) {
          log(`Attempt ${attemptCount}/${retries}${timeMessage} - Backend request timed out`);
          setTimeout(checkAPI, delay);
        } else {
          logError(`Backend API check timed out after ${retries} attempts (5 minutes)`);
          resolve(false);
        }
      });
      
      req.end();
    };
    
    checkAPI();
  });
}

// Function to check if a port is available (not being used)
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.once('error', () => {
      // Port is in use
      resolve(false);
    });
    
    server.once('listening', () => {
      // Port is available
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

// Function to ensure executable permissions on Unix systems
function ensureExecutablePermissions(filePath) {
  try {
    if (process.platform !== 'win32' && fs.existsSync(filePath)) {
      // Make sure the file is executable (chmod 755)
      fs.chmodSync(filePath, '755');
      return true;
    }
  } catch (err) {
    logError(`Failed to set permissions for ${filePath}: ${err.message}`);
  }
  return false;
}

// Function to find the backend executable with fallbacks
function findBackendExecutable() {
  logError(`BACKEND SEARCH: Looking for backend executable...`);
  logError(`Resources path: ${process.resourcesPath}`);
  
  // Possible locations for the backend executable
  const possiblePaths = [
    // Primary location (extraResources/backend)
    path.join(process.resourcesPath, 'backend', 'Companio-Backend'),
    // Windows uses .exe extension
    path.join(process.resourcesPath, 'backend', 'Companio-Backend.exe'),
    // Alternative locations
    path.join(app.getAppPath(), 'backend', 'Companio-Backend'),
    path.join(app.getAppPath(), 'backend', 'Companio-Backend.exe'),
    // More locations if needed
    path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'Companio-Backend'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'Companio-Backend.exe')
  ];

  // Check each possible path
  for (const execPath of possiblePaths) {
    logError(`Checking for backend at: ${execPath}`);
    if (fs.existsSync(execPath)) {
      // Check file permissions and details
      try {
        const stats = fs.statSync(execPath);
        logError(`FOUND: ${execPath}`);
        logError(`  File size: ${stats.size} bytes`);
        logError(`  File permissions: ${stats.mode.toString(8)}`);
        logError(`  Is file: ${stats.isFile()}`);
        logError(`  Is directory: ${stats.isDirectory()}`);
        logError(`  Last modified: ${stats.mtime}`);
        
        // On Unix systems, check if file has execute permission
        if (process.platform !== 'win32') {
          // Convert mode to octal string and check if executable bit is set
          const octalMode = stats.mode.toString(8);
          const lastChar = octalMode.charAt(octalMode.length - 1);
          const executableBit = parseInt(lastChar) & 1;
          logError(`  Has executable bit: ${executableBit === 1 ? 'Yes' : 'No'}`);
        }
        
        // Ensure the executable has proper permissions
        ensureExecutablePermissions(execPath);
        return execPath;
      } catch (err) {
        logError(`Error checking file stats: ${err.message}`);
      }
    }
  }

  // Log all possible locations
  logError('BACKEND NOT FOUND: Executable not found in any of these locations:');
  possiblePaths.forEach(p => logError(` - ${p}`));
  
  // Try to explore directories to help with debugging
  try {
    const resourcesDir = fs.readdirSync(process.resourcesPath);
    logError('Contents of resources directory:');
    resourcesDir.forEach(item => logError(` - ${item}`));
    
    const backendDir = path.join(process.resourcesPath, 'backend');
    if (fs.existsSync(backendDir)) {
      logError('Contents of backend directory:');
      fs.readdirSync(backendDir).forEach(item => logError(` - ${item}`));
    }
  } catch (err) {
    logError(`Error exploring directories: ${err.message}`);
  }
  
  return null;
}

// Function to check if the app was launched from Finder on macOS
function isMacOSAppLaunchedFromFinder() {
  return process.platform === 'darwin' && (
    !process.env.TERM || 
    process.env.TERM === '' || 
    process.env.LAUNCHED_FROM_FINDER === '1'
  );
}

// Add a new function to run the backend with exec
async function tryRunBackendWithExec(backendPath) {
  return new Promise((resolve) => {
    logError('Trying to run backend with exec (specifically for macOS Finder launches)');
    
    const { exec } = require('child_process');
    const backendDir = path.dirname(backendPath);
    
    // Build a command that explicitly includes cd to the directory
    const command = `cd "${backendDir}" && "${backendPath}"`;
    logError(`Executing command: ${command}`);
    
    backendProcess = exec(command, {
      env: {
        ...process.env,
        COMPANIO_APP_DIR: app.getPath('userData'),
        HOME: process.env.HOME || require('os').homedir(), 
        PATH: resolveEnvPath(process.env.PATH)
      },
      cwd: backendDir
    });
    
    if (!backendProcess || !backendProcess.pid) {
      logError('Failed to start backend with exec');
      resolve(false);
      return;
    }
    
    logError(`Backend started with exec, PID: ${backendProcess.pid}`);
    
    // Set up output handlers
    backendProcess.stdout.on('data', (data) => {
      log(`Backend: ${data.toString().trim()}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
      logError(`Backend ERROR: ${data.toString().trim()}`);
    });
    
    backendProcess.on('error', (err) => {
      logError(`Backend exec error: ${err.message}`);
    });
    
    backendProcess.on('close', (code) => {
      logError(`Backend process (exec) exited with code ${code}`);
    });
    
    resolve(true);
  });
}

// Run the backend with a shell script for macOS Finder launches
async function tryRunBackendWithShellScript(backendPath) {
  return new Promise((resolve) => {
    const fs = require('fs');
    const backendDir = path.dirname(backendPath);
    const tempDir = app.getPath('temp');
    
    // Create a shell script that will properly launch the backend
    const scriptPath = path.join(tempDir, 'run_backend.sh');
    const scriptContent = `#!/bin/bash
# Log to file for debugging
LOGFILE="${app.getPath('userData')}/backend-launch.log"
echo "$(date): Starting backend script" > "$LOGFILE"

# Check common espeak installations
ESPEAK_PATHS=(
  "/opt/homebrew/bin/espeak"
  "/usr/local/bin/espeak"
  "/usr/bin/espeak"
)

for path in "\${ESPEAK_PATHS[@]}"; do
  if [ -f "$path" ]; then
    echo "$(date): Found espeak at: $path" >> "$LOGFILE"
    export ESPEAK_LIBRARY="$path"
    break
  fi
done

# If no espeak found, log the error
if [ -z "$ESPEAK_LIBRARY" ]; then
  echo "$(date): ERROR - Could not find espeak in common locations" >> "$LOGFILE"
  # Continue anyway, the Python app will handle the error
fi

# Set up environment
export COMPANIO_APP_DIR="${app.getPath('userData')}"
export DYLD_LIBRARY_PATH="${backendDir}"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export HOME="${process.env.HOME || require('os').homedir()}"

# Echo diagnostic info
echo "$(date): Starting backend from shell script" >> "$LOGFILE"
echo "Current directory: $(pwd)" >> "$LOGFILE"
echo "Backend path: ${backendPath}" >> "$LOGFILE"
echo "COMPANIO_APP_DIR: $COMPANIO_APP_DIR" >> "$LOGFILE"
echo "HOME: $HOME" >> "$LOGFILE"
echo "ESPEAK_LIBRARY: $ESPEAK_LIBRARY" >> "$LOGFILE"
echo "PATH: $PATH" >> "$LOGFILE"
echo "Listing backend directory:" >> "$LOGFILE"
ls -la "${backendDir}" >> "$LOGFILE"

# Make sure the backend is executable
chmod +x "${backendPath}"
echo "$(date): Made backend executable" >> "$LOGFILE"

# Change to the backend directory
cd "${backendDir}"
echo "$(date): Changed directory to ${backendDir}" >> "$LOGFILE"

# Run the backend executable with output redirection
"${backendPath}" >> "$LOGFILE" 2>&1
`;

    logError(`Creating shell script at: ${scriptPath}`);
    
    try {
      // Write the script
      fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
      fs.chmodSync(scriptPath, 0o755); // Make sure it's executable
      logError(`Shell script created with content:\n${scriptContent}`);
      
      // Double-check the script's permissions by reading them back
      const scriptStats = fs.statSync(scriptPath);
      logError(`Script permissions: ${scriptStats.mode.toString(8)}`);
      
      // Use spawn instead of exec for better control and stability
      backendProcess = spawn('/bin/bash', [scriptPath], {
        env: {
          ...process.env,
          HOME: process.env.HOME || require('os').homedir(),
          PATH: resolveEnvPath(process.env.PATH),
          PYTHONUNBUFFERED: "1"
        },
        detached: true, // This is important for Finder launches
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      if (!backendProcess || !backendProcess.pid) {
        logError('Failed to start shell script');
        resolve(false);
        return;
      }
      
      logError(`Shell script started with PID: ${backendProcess.pid}`);
      
      // Set up output handlers
      backendProcess.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            log(`Backend (shell): ${line.trim()}`);
          }
        }
      });
      
      backendProcess.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            logError(`Backend UPDATE (shell): ${line.trim()}`);
          }
        }
      });
      
      backendProcess.on('error', (err) => {
        logError(`Shell script error: ${err.message}`);
      });
      
      backendProcess.on('close', (code) => {
        logError(`Shell script exited with code ${code}`);
      });
      
      resolve(true);
    } catch (err) {
      logError(`Error with shell script approach: ${err.message}`);
      if (err.stack) logError(err.stack);
      resolve(false);
    }
  });
}

// Function to run the backend process with improved reliability
async function runBackend() {
  if (!app.isPackaged) {
    log('Development mode, not starting backend');
    return true;
  }
  
  // Check if port 8000 is already in use
  const portAvailable = await isPortAvailable(8000);
  if (!portAvailable) {
    log('Port 8000 is already in use. Checking if it\'s our backend...');
    
    // Check if the backend API is responding on this port
    const isApiUp = await checkBackendAPI(8000, 240, 500);
    if (isApiUp) {
      log('Backend API is already running and responding correctly');
      return true;
    } else {
      logError('Port 8000 is in use but not by our backend API');
      return false;
    }
  }
  
  // Find the backend executable
  const backendPath = findBackendExecutable();
  if (!backendPath) {
    logError('Could not find backend executable');
    return false;
  }
  
  // Log environment details for debugging
  logError('Environment details:');
  logError(`HOME: ${process.env.HOME || 'Not set'}`);
  logError(`USER: ${process.env.USER || 'Not set'}`);
  logError(`PATH: ${process.env.PATH || 'Not set'}`);
  logError(`PWD: ${process.cwd()}`);
  
  // Make sure the file is executable on macOS/Linux
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(backendPath, '755');
      log(`Made backend executable (chmod 755): ${backendPath}`);
    } catch (err) {
      logError(`Failed to set executable permissions: ${err.message}`);
    }
  }
  
  // Check if we're launched from Finder on macOS
  if (isMacOSAppLaunchedFromFinder()) {
    logError('App was launched from Finder - trying multiple methods');
    
    // Try the shell script method first
    logError('Trying shell script method first...');
    await tryRunBackendWithShellScript(backendPath);
    
    // Check if the API is responding
    const shellCheckPromise = checkBackendAPI(8000, 600, 500); 
    const shellTimeout = new Promise(resolve => setTimeout(() => resolve(false), 300000)); 
    
    const shellResult = await Promise.race([shellCheckPromise, shellTimeout]);
    
    if (!shellResult) {
      logError('Shell script method failed after 3 minutes, trying exec method...');
      killBackend();
      await tryRunBackendWithExec(backendPath);
    }
  } else {
    logError('App was launched from Terminal - using spawn method for backend');
    
    // Use the original spawn method for Terminal launches
    try {
      logError(`STARTUP ATTEMPT: Launching backend from: ${backendPath}`);
      // Log the exact command we're about to run
      logError(`Command: ${backendPath}`);
      logError(`Working directory: ${process.cwd()}`);
      logError(`Environment variables: COMPANIO_APP_DIR=${app.getPath('userData')}`);
      
      // Create a more detailed spawn call with better logging
      backendProcess = spawn(
        backendPath,
        [], 
        {
          windowsHide: true, 
          shell: process.platform === 'win32', 
          env: {
            ...process.env,
            // Use absolute path for COMPANIO_APP_DIR
            COMPANIO_APP_DIR: app.getPath('userData'),
            // Set proper HOME directory
            HOME: process.env.HOME || require('os').homedir(),
            // Ensure PATH is properly set
            PATH: resolveEnvPath(process.env.PATH),
            // Ensure Python output isn't buffered
            PYTHONUNBUFFERED: "1",
            // Set PWD explicitly
            PWD: path.dirname(backendPath)
          },
          // Set the working directory to the backend directory (absolute path)
          cwd: path.dirname(backendPath),
          // Set stdio to 'pipe' to ensure we can capture all output
          stdio: ['ignore', 'pipe', 'pipe']
        }
      );
      
      if (!backendProcess || !backendProcess.pid) {
        logError('STARTUP FAILED: No valid process ID returned');
        clearTimeout(startupTimeout);
        return false;
      }
      
      logError(`STARTUP SUCCESS: Backend process started with PID: ${backendProcess.pid}`);
      
      // Improved output handling with encoding specified
      backendProcess.stdout.setEncoding('utf8');
      backendProcess.stderr.setEncoding('utf8');
      
      // Log stdout and stderr from the backend process
      backendProcess.stdout.on('data', (data) => {
        // Split the output by lines to make it more readable
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            log(`Backend: ${line.trim()}`);
          }
        }
      });
      
      backendProcess.stderr.on('data', (data) => {
        // Split the output by lines to make it more readable
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            logError(`Backend ERROR: ${line.trim()}`);
          }
        }
      });
      
      // More detailed error handling
      backendProcess.on('error', (err) => {
        logError(`PROCESS ERROR: ${err.message}`);
        if (err.stack) logError(err.stack);
      });
      
      backendProcess.on('close', (code, signal) => {
        if (code === 0) {
          log(`Backend process exited normally with code ${code}`);
        } else {
          logError(`Backend process exited with code ${code}, signal: ${signal || 'none'}`);
        }
        backendProcess = null;
      });
    } catch (err) {
      logError(`Error starting backend process: ${err.message}`);
      if (err.stack) logError(err.stack);
      clearTimeout(startupTimeout);
      return false;
    }
  }
  
  // Set a timeout to ensure we don't wait forever for the backend
  const timeoutPromise = new Promise((resolve) => {
    startupTimeout = setTimeout(() => {
      logError('Backend startup timed out after 5 minutes');
      resolve(false);
    }, 300000); // 5 minute timeout 
  });
  
  // Wait for the API to be responsive
  const apiCheckPromise = checkBackendAPI();
  
  // Race between the API check and the timeout
  const result = await Promise.race([apiCheckPromise, timeoutPromise]);
  clearTimeout(startupTimeout);
  
  if (result) {
    log('Backend API is responding - startup complete');
    return true;
  } else {
    logError('Backend API failed to respond correctly');
    // Try to kill the process if it's running but not responding
    killBackend();
    return false;
  }
}

// Enhanced function to kill the backend
function killBackend() {
  if (backendProcess && backendProcess.pid) {
    log(`Stopping backend process with PID: ${backendProcess.pid}`);
    try {
      // Use tree-kill for reliable process termination across platforms
      kill(backendProcess.pid, 'SIGTERM', (err) => {
        if (err) {
          logError(`Error in tree-kill: ${err}`);
          // Try harder on Windows
          if (process.platform === 'win32') {
            try {
              require('child_process').execSync(`taskkill /pid ${backendProcess.pid} /f /t`);
            } catch (e) {
              logError(`Failed taskkill: ${e.message}`);
            }
          }
        } else {
          log('Backend process killed successfully');
        }
        backendProcess = null;
      });
    } catch (err) {
      logError(`Error in killBackend: ${err.message}`);
      backendProcess = null;
    }
  }
}

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    }
  });
  
  enable(mainWindow.webContents); // Enable remote module for this window

  // Load the loading screen first
  const loadingUrl = path.join(__dirname, 'loading.html');
    
  log(`Loading screen from: ${loadingUrl}`);
  mainWindow.loadFile(loadingUrl);

  // Open DevTools in development mode or for debugging
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize app when ready
app.whenReady().then(async () => {
  initialize(); // Initialize remote module
  
  // Create window immediately to show loading screen
  createWindow();
  
  // Then start the backend process in parallel
  log('Starting backend process...');
  runBackend().then(backendStarted => {
    if (backendStarted) {
      log('Backend started successfully');
    } else {
      logError('Failed to start backend, but loading screen will try to connect anyway');
    }
  });
});

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

// Let renderer process know about backend status
ipcMain.handle('get-backend-status', async () => {
  if (backendProcess && backendProcess.pid) {
    // Check if backend is still responding
    const isResponding = await checkBackendAPI(8000, 2, 500);
    return {
      running: true,
      responding: isResponding,
      pid: backendProcess.pid
    };
  }
  return { running: false, responding: false };
});

// Ensure backend is closed when app quits
app.on('before-quit', () => {
  killBackend();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  killBackend();
  if (process.platform !== 'darwin') app.quit();
});

// Re-create window if needed when app is activated
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});