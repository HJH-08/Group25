import os
import sys
import subprocess
import time
import platform
import signal
import shutil
import appdirs
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QdrantManager:
    def __init__(self):
        self.process = None
        self.qdrant_dir = None
        self.data_dir = None
        self.config_path = None
        self.binary_path = None
        
        # Set up paths based on environment
        self._setup_paths()
        
    def _setup_paths(self):
        """Set up all necessary paths for Qdrant"""
        # Determine the platform and executable name
        system = platform.system().lower()
        if system == 'windows':
            qdrant_binary = "qdrant.exe"
        elif system == 'darwin':
            qdrant_binary = "qdrant-macos"
        else:
            qdrant_binary = "qdrant-linux"
        
        # First check environment variable for storage path
        app_data_dir = os.environ.get('COMPANIO_APP_DIR')
        qdrant_storage_path = os.environ.get('QDRANT_STORAGE_PATH')
        
        # If running as bundled executable
        if getattr(sys, 'frozen', False):
            # Get the main application directory
            base_dir = os.path.dirname(sys.executable)
            
            # Try multiple locations for the Qdrant binary
            possible_binary_paths = [
                os.path.join(base_dir, "templates", "bin", qdrant_binary),  # Standard layout
                os.path.join(base_dir, "bin", qdrant_binary),               # Alternate layout
                os.path.join(base_dir, qdrant_binary)                       # Root directory
            ]
            
            # Check each path and use the first one that exists
            self.binary_path = None
            for path in possible_binary_paths:
                if os.path.exists(path):
                    self.binary_path = path
                    logger.info(f"Found Qdrant binary at: {path}")
                    break
            
            # If binary not found, use the first path (will generate appropriate error)
            if self.binary_path is None:
                self.binary_path = possible_binary_paths[0]
                logger.warning(f"Qdrant binary not found, will try: {self.binary_path}")
            
            # For the storage directory, first try environment variables
            if app_data_dir and qdrant_storage_path:
                logger.info(f"Using environment-provided storage path: {qdrant_storage_path}")
                self.data_dir = qdrant_storage_path
                self.qdrant_dir = os.path.dirname(self.data_dir)
                self.snapshots_dir = os.path.join(self.qdrant_dir, "snapshots")
            else:
                # If environment variables not set, use application support directory
                app_name = "Companio"
                app_author = "Group25"
                app_data_dir = appdirs.user_data_dir(app_name, app_author)
                self.qdrant_dir = os.path.join(app_data_dir, "qdrant")
                self.data_dir = os.path.join(self.qdrant_dir, "data")
                self.snapshots_dir = os.path.join(self.qdrant_dir, "snapshots")
                logger.info(f"Using app data storage path: {self.data_dir}")
                
        else:
            # For development environment
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.binary_path = os.path.join(base_dir, "bin", qdrant_binary)
            
            if qdrant_storage_path:
                # Use environment variable if set
                self.data_dir = qdrant_storage_path
                self.qdrant_dir = os.path.dirname(self.data_dir)
                self.snapshots_dir = os.path.join(self.qdrant_dir, "snapshots")
            else:
                # Otherwise use local directory
                self.qdrant_dir = os.path.join(base_dir, "qdrant")
                self.data_dir = os.path.join(self.qdrant_dir, "data")
                self.snapshots_dir = os.path.join(self.qdrant_dir, "snapshots")
        
        # Config file is always in the qdrant_dir
        self.config_path = os.path.join(self.qdrant_dir, "config.yaml")
        
        logger.info(f"Qdrant binary path: {self.binary_path}")
        logger.info(f"Qdrant data directory: {self.data_dir}")
        
    def prepare_directories(self):
        """Create necessary directories and clean up initialization files"""
        os.makedirs(self.qdrant_dir, exist_ok=True)
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.snapshots_dir, exist_ok=True)
        
        # Make binary executable if it exists
        if platform.system().lower() != 'windows' and os.path.exists(self.binary_path):
            try:
                os.chmod(self.binary_path, 0o755)
                logger.info(f"Set executable permissions for: {self.binary_path}")
            except Exception as e:
                logger.warning(f"Could not set executable permissions: {e}")
        
        # Clean up any existing initialization files
        self._cleanup_initialization_files()
    
    def _cleanup_initialization_files(self):
        """Remove any existing .qdrant-initialized files"""
        try:
            if os.path.exists(self.qdrant_dir):
                for item in os.listdir(self.qdrant_dir):
                    if item.startswith('.qdrant-initialized'):
                        file_path = os.path.join(self.qdrant_dir, item)
                        try:
                            os.remove(file_path)
                            logger.info(f"Removed old initialization file: {item}")
                        except Exception as e:
                            logger.warning(f"Could not remove {item}: {e}")
        except Exception as e:
            logger.warning(f"Error cleaning initialization files: {e}")
    
    def write_config(self):
        """Create the Qdrant configuration file"""
        with open(self.config_path, "w") as f:
            f.write(f"""
storage:
  storage_path: {self.data_dir}
  snapshots_path: {self.snapshots_dir}

service:
  host: 0.0.0.0
  http_port: 6333
  grpc_port: 6334
""")
        logger.info(f"Created Qdrant config at: {self.config_path}")
    
    def _check_binary_exists(self):
        """Check if the binary exists and is executable"""
        if not os.path.exists(self.binary_path):
            logger.error(f"Qdrant binary not found at: {self.binary_path}")
            return False
            
        if platform.system().lower() != 'windows' and not os.access(self.binary_path, os.X_OK):
            logger.warning(f"Qdrant binary exists but is not executable: {self.binary_path}")
            try:
                os.chmod(self.binary_path, 0o755)
                logger.info("Set executable permissions")
                return True
            except Exception as e:
                logger.error(f"Failed to set executable permissions: {e}")
                return False
                
        return True
    
    def start_server(self):
        """Start the Qdrant server process"""
        print("DEBUG: About to start Qdrant server")
        logger.info(f"Starting Qdrant from {self.binary_path}")
        logger.info(f"Qdrant storage location: {self.data_dir}")
        
        print(f"Starting Qdrant from {self.binary_path}")
        print(f"Qdrant storage location: {self.data_dir}")
        
        # Check if the binary exists
        print("DEBUG: Checking if Qdrant binary exists")
        if not self._check_binary_exists():
            # Fall back to using a Docker container or remote Qdrant
            print("DEBUG: Binary doesn't exist, handling missing binary")
            self._handle_missing_binary()
            return False
        
        # Prepare directories and config
        print("DEBUG: Preparing Qdrant directories and config")
        self.prepare_directories()
        self.write_config()
        
        print("DEBUG: About to launch Qdrant process")
        try:
            # Try different launch methods in order of preference
            launch_methods = [
                # Method 1: Use config file (newer versions)
                lambda: subprocess.Popen(
                    [self.binary_path, "--config-path", self.config_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=self.qdrant_dir
                ),
                # Method 2: Just the binary with environment variables
                lambda: subprocess.Popen(
                    [self.binary_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=dict(os.environ, QDRANT_STORAGE_PATH=self.data_dir),
                    cwd=self.qdrant_dir
                ),
                # Method 3: Old style with direct storage path
                lambda: subprocess.Popen(
                    [self.binary_path, "--storage", self.data_dir],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=self.qdrant_dir
                )
            ]
            
            for method_number, launch_method in enumerate(launch_methods, 1):
                logger.info(f"Attempting Qdrant launch method {method_number}...")
                print(f"Attempting Qdrant launch method {method_number}...")
                
                try:
                    self.process = launch_method()
                    
                    # Wait for Qdrant to initialize
                    time.sleep(5)
                    
                    # Check if process is still running
                    if self.process.poll() is None:
                        # Process is still running, success!
                        logger.info(f"Qdrant started successfully using method {method_number}")
                        print(f"Qdrant started successfully using method {method_number}")
                        return True
                    else:
                        # Process exited - read error output and try next method
                        stdout, stderr = self.process.communicate()
                        error_msg = stderr.decode()
                        logger.warning(f"Qdrant launch method {method_number} failed: {error_msg}")
                        print(f"Qdrant launch method {method_number} failed")
                        self.process = None
                except Exception as e:
                    logger.error(f"Error with launch method {method_number}: {e}")
                    print(f"Error with launch method {method_number}: {e}")
                    self.process = None
            
            logger.error("All Qdrant launch methods failed")
            print("All Qdrant launch methods failed")
            return False
            
        except Exception as e:
            logger.error(f"Error starting Qdrant: {e}")
            print(f"Error starting Qdrant: {e}")
            self.process = None
            return False
    
    def _handle_missing_binary(self):
        """Handle the case where the Qdrant binary is missing"""
        logger.warning("Qdrant binary not found. Vector search functionality will be limited.")
        print("Warning: Failed to start Qdrant server. Vector search may not work.")
        
        # Here you could implement a fallback strategy:
        # 1. Try to use a remote Qdrant instance if available
        # 2. Disable vector search features gracefully
        # 3. Use an alternative vector database
        
        # For now, we just log the warning
    
    def stop_server(self):
        """Stop the Qdrant server gracefully"""
        if self.process is not None:
            logger.info("Stopping Qdrant server...")
            
            # Try graceful shutdown first
            if platform.system().lower() != 'windows':
                self.process.send_signal(signal.SIGTERM)
            else:
                self.process.terminate()
                
            try:
                self.process.wait(timeout=10)
                logger.info("Qdrant server shut down cleanly")
            except subprocess.TimeoutExpired:
                logger.warning("Qdrant didn't shut down in time, forcing termination...")
                self.process.kill()
                self.process.wait(timeout=5)
            
            self.process = None