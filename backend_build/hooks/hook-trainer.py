# hook-trainer.py
from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs
import os
import sys
from pathlib import Path
import site
import tempfile

# Try to find the trainer package
try:
    import trainer
    trainer_path = os.path.dirname(trainer.__file__)
    datas = [(os.path.join(trainer_path, 'VERSION'), 'trainer')]
except ImportError:
    # If trainer is not directly importable, try to find it in site-packages
    site_packages = site.getsitepackages()
    
    trainer_found = False
    for sp in site_packages:
        trainer_path = os.path.join(sp, 'trainer')
        version_file = os.path.join(trainer_path, 'VERSION')
        if os.path.exists(trainer_path) and os.path.isdir(trainer_path):
            if os.path.exists(version_file):
                datas = [(version_file, 'trainer')]
                trainer_found = True
                break
    
    if not trainer_found:
        # Create a dummy VERSION file
        print("Warning: trainer package VERSION file not found, creating a dummy file")
        temp_dir = tempfile.mkdtemp()
        dummy_version = os.path.join(temp_dir, "VERSION")
        with open(dummy_version, "w") as f:
            f.write("0.0.0")
        datas = [(dummy_version, 'trainer')]
