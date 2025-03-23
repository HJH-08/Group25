# Main entry point for the application
import os
import sys
import socket
import tempfile
import logging
import fcntl
import time
import threading
import traceback

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def is_port_in_use(port, host='127.0.0.1'):
    """Check if a port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind((host, port))
            return False
        except socket.error:
            return True

def acquire_lock():
    """Try to acquire an exclusive lock to ensure only one instance runs"""
    # Create app data directory if it doesn't exist
    app_data_dir = os.environ.get('COMPANIO_APP_DIR')
    if not app_data_dir:
        temp_dir = tempfile.gettempdir()
        app_data_dir = os.path.join(temp_dir, 'Companio')
        os.makedirs(app_data_dir, exist_ok=True)
    
    # Lock file path
    lock_file_path = os.path.join(app_data_dir, 'companio.lock')
    
    # Try to acquire the lock
    try:
        lock_file = open(lock_file_path, 'w')
        fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        # Keep the file object to maintain the lock
        return lock_file
    except IOError:
        logger.error("Another instance is already running. Exiting.")
        sys.exit(1)

def print_stack_traces():
    """Print stack traces for all threads to diagnose hanging"""
    print("\n==== DIAGNOSTIC INFO: THREAD STACK TRACES ====")
    for thread_id, frame in sys._current_frames().items():
        print(f"\nThread {thread_id}:")
        traceback.print_stack(frame)
    print("\n==== END DIAGNOSTIC INFO ====")

# Main application entry point
def main():
    # Add the current directory to the Python path if not already there
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if (current_dir not in sys.path):
        sys.path.append(current_dir)
    
    # Check if our server port (8000) is already in use
    if is_port_in_use(8000):
        logger.error("Port 8000 is already in use. Another instance may be running. Exiting.")
        sys.exit(1)
    
    # Check if Qdrant port (6333) is already in use
    if is_port_in_use(6333):
        logger.info("Qdrant port 6333 is already in use. Will connect to existing Qdrant server.")
    
    # Acquire process lock to prevent multiple instances
    lock = acquire_lock()
    
    # Add a timeout to diagnose hanging
    def timeout_handler():
        print("\n==== APPLICATION TIMEOUT - DIAGNOSTIC INFO ====")
        print("Application failed to start within the timeout period")
        print_stack_traces()
        print("\n==== END DIAGNOSTIC INFO ====")
        os._exit(1)  # Force exit
    
    # Set a timeout timer (increase to 60 seconds to give more time for startup)
    timeout = 60  # seconds
    timer = threading.Timer(timeout, timeout_handler)
    timer.daemon = True
    timer.start()
    
    try:
        print("DEBUG: About to import server module")
        # Import server to define the app
        import server
        from server import app
        
        # Cancel the timeout timer as we've successfully imported
        timer.cancel()
        
        print("DEBUG: Successfully imported server, starting Uvicorn")
        
        # Now start the actual server
        import uvicorn
        
        # Use multiprocess worker config for better reliability
        config = uvicorn.Config(
            app=app,
            host="0.0.0.0",
            port=8000,
            log_level="info"
        )
        
        # Create and start the server
        server = uvicorn.Server(config)
        server.run()
        
        print("DEBUG: Server has shut down")
        
    except Exception as e:
        # Cancel the timer if there's an error
        timer.cancel()
        print(f"ERROR starting server: {e}")
        traceback.print_exc()
        sys.exit(1)
    
    # Keep the lock file open as long as the program runs

if __name__ == "__main__":
    main()