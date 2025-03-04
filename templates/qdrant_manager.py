import os
import sys
import subprocess
import time
import platform
import signal
import shutil

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
        
        # Path to the binary and data directories
        if getattr(sys, 'frozen', False):
            # If running as bundled executable
            base_dir = os.path.dirname(sys.executable)
            self.binary_path = os.path.join(base_dir, "templates", "bin", qdrant_binary)
            self.qdrant_dir = os.path.join(base_dir, "qdrant")
        else:
            # For development
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.binary_path = os.path.join(base_dir, "bin", qdrant_binary)
            self.qdrant_dir = os.path.join(base_dir, "qdrant")
        
        # Set up storage directories
        self.data_dir = os.path.join(self.qdrant_dir, "data")
        self.snapshots_dir = os.path.join(self.qdrant_dir, "snapshots")
        self.config_path = os.path.join(self.qdrant_dir, "config.yaml")
        
    def prepare_directories(self):
        """Create necessary directories and clean up initialization files"""
        os.makedirs(self.qdrant_dir, exist_ok=True)
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.snapshots_dir, exist_ok=True)
        
        # Make binary executable
        if platform.system().lower() != 'windows':
            try:
                os.chmod(self.binary_path, 0o755)
            except Exception as e:
                print(f"Warning: Could not set executable permissions: {e}")
        
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
                            print(f"Removed old initialization file: {item}")
                        except Exception as e:
                            print(f"Warning: Could not remove {item}: {e}")
        except Exception as e:
            print(f"Warning: Error cleaning initialization files: {e}")
    
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
    
    def start_server(self):
        """Start the Qdrant server process"""
        print(f"Starting Qdrant from {self.binary_path}")
        print(f"Qdrant storage location: {self.data_dir}")
        
        # Prepare directories and config
        self.prepare_directories()
        self.write_config()
        
        try:
            # Try different launch methods in order of preference
            launch_methods = [
                # Method 1: Use config file (newer versions)
                lambda: subprocess.Popen(
                    [self.binary_path, "--config-path", self.config_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=self.qdrant_dir  # Set working directory to qdrant_dir
                ),
                # Method 2: Just the binary with environment variables
                lambda: subprocess.Popen(
                    [self.binary_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=dict(os.environ, QDRANT_STORAGE_PATH=self.data_dir),
                    cwd=self.qdrant_dir  # Set working directory to qdrant_dir
                ),
                # Method 3: Old style with direct storage path
                lambda: subprocess.Popen(
                    [self.binary_path, "--storage", self.data_dir],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=self.qdrant_dir  # Set working directory to qdrant_dir
                )
            ]
            
            for method_number, launch_method in enumerate(launch_methods, 1):
                print(f"Attempting Qdrant launch method {method_number}...")
                self.process = launch_method()
                
                # Wait for Qdrant to initialize
                time.sleep(5)
                
                # Check if process is still running
                if self.process.poll() is None:
                    # Process is still running, success!
                    print(f"Qdrant started successfully using method {method_number}")
                    return True
                else:
                    # Process exited - read error output and try next method
                    stdout, stderr = self.process.communicate()
                    print(f"Qdrant launch method {method_number} failed: {stderr.decode()}")
                    self.process = None
            
            if not self.process:
                print("All Qdrant launch methods failed")
                return False
            
        except Exception as e:
            print(f"Error starting Qdrant: {e}")
            self.process = None
            return False
    
    def stop_server(self):
        """Stop the Qdrant server gracefully"""
        if self.process is not None:
            print("Stopping Qdrant server...")
            
            # Try graceful shutdown first
            if platform.system().lower() != 'windows':
                self.process.send_signal(signal.SIGTERM)
            else:
                self.process.terminate()
                
            try:
                self.process.wait(timeout=10)
                print("Qdrant server shut down cleanly")
            except subprocess.TimeoutExpired:
                print("Qdrant didn't shut down in time, forcing termination...")
                self.process.kill()
                self.process.wait(timeout=5)
            
            self.process = None