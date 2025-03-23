# hook-qdrant.py
from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import os
import shutil
import tempfile

# Collect all submodules
hiddenimports = collect_submodules('qdrant_client')

# Collect data files
datas = collect_data_files('qdrant_client')

# Add the Qdrant binary with correct path structure
qdrant_binary_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'templates', 'bin', 'qdrant-macos')
if os.path.exists(qdrant_binary_path):
    # Copy to a temporary directory to ensure it's readable and executable
    temp_dir = tempfile.mkdtemp()
    temp_templates_dir = os.path.join(temp_dir, 'templates')
    temp_bin_dir = os.path.join(temp_templates_dir, 'bin')
    os.makedirs(temp_bin_dir, exist_ok=True)
    
    # Copy the binary
    temp_qdrant_path = os.path.join(temp_bin_dir, 'qdrant-macos')
    shutil.copy2(qdrant_binary_path, temp_qdrant_path)
    
    # Make sure it's executable
    os.chmod(temp_qdrant_path, 0o755)
    
    # Add to datas - preserving the templates/bin path structure
    datas.append((temp_qdrant_path, 'templates/bin'))
    print(f"Added Qdrant binary: {qdrant_binary_path} -> templates/bin/qdrant-macos")
else:
    print(f"Warning: Could not find Qdrant binary at {qdrant_binary_path}")
