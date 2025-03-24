# hook-gruut.py
from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import os
import site
import tempfile

# Try to find the gruut package
try:
    import gruut
    gruut_path = os.path.dirname(gruut.__file__)
    version_file = os.path.join(gruut_path, 'VERSION')
    
    if os.path.exists(version_file):
        datas = [(version_file, 'gruut')]
    else:
        # Create dummy VERSION file if not found
        print("Warning: gruut VERSION file not found, creating a dummy file")
        temp_dir = tempfile.mkdtemp()
        dummy_version = os.path.join(temp_dir, "VERSION")
        with open(dummy_version, "w") as f:
            f.write("0.0.0")
        datas = [(dummy_version, 'gruut')]
        
except ImportError:
    # If gruut is not directly importable, try to find it in site-packages
    site_packages = site.getsitepackages()
    
    gruut_found = False
    for sp in site_packages:
        gruut_path = os.path.join(sp, 'gruut')
        version_file = os.path.join(gruut_path, 'VERSION')
        if os.path.exists(gruut_path) and os.path.isdir(gruut_path):
            if os.path.exists(version_file):
                datas = [(version_file, 'gruut')]
                gruut_found = True
                break
    
    if not gruut_found:
        # Create dummy VERSION file
        print("Warning: gruut package VERSION file not found, creating a dummy file")
        temp_dir = tempfile.mkdtemp()
        dummy_version = os.path.join(temp_dir, "VERSION")
        with open(dummy_version, "w") as f:
            f.write("0.0.0")
        datas = [(dummy_version, 'gruut')]

# Collect all submodules
hiddenimports = collect_submodules('gruut')

# Collect additional data files
additional_datas = collect_data_files('gruut')
datas.extend(additional_datas)
