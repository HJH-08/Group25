import os
import sys
import tempfile
import appdirs
from pathlib import Path

def setup_runtime_environment():
    # Set up application constants
    app_name = "Companio"
    app_author = "Group25"
    
    # Get the application data directory in the user's documents/app data
    app_data_dir = appdirs.user_data_dir(app_name, app_author)
    
    # Create paths for Qdrant data
    qdrant_data_dir = os.path.join(app_data_dir, "qdrant")
    qdrant_storage_dir = os.path.join(qdrant_data_dir, "data")
    qdrant_snapshots_dir = os.path.join(qdrant_data_dir, "snapshots")
    
    # Create the directories if they don't exist
    os.makedirs(qdrant_storage_dir, exist_ok=True)
    os.makedirs(qdrant_snapshots_dir, exist_ok=True)
    
    # Find the root directory for the frozen application
    if getattr(sys, 'frozen', False):
        # Running as a bundled executable
        app_dir = os.path.dirname(sys.executable)
    else:
        # Running in development mode
        app_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Adjust environment variables to point to our data locations
    os.environ['QDRANT_STORAGE_PATH'] = qdrant_storage_dir
    os.environ['COMPANIO_APP_DIR'] = app_data_dir
    
    # Print diagnostic information
    print(f"Companio application directory: {app_data_dir}")
    print(f"Qdrant storage directory: {qdrant_storage_dir}")
    
    # Add the templates directory to the Python path
    if getattr(sys, 'frozen', False):
        templates_dir = os.path.join(app_dir, "templates")
        if templates_dir not in sys.path:
            sys.path.append(templates_dir)

# Run the setup
setup_runtime_environment()
