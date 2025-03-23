# hook-jamo.py
from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import os
import site

# Collect all data files from jamo package
datas = collect_data_files('jamo')

# If collect_data_files doesn't find the files, locate them manually
if not any(d[0].endswith('.json') for d in datas):
    # Try to find jamo package
    try:
        import jamo
        jamo_dir = os.path.dirname(jamo.__file__)
        
        # Path to the data directory
        data_dir = os.path.join(jamo_dir, 'data')
        
        if os.path.exists(data_dir) and os.path.isdir(data_dir):
            # Find all .json files in data directory
            json_files = []
            for file in os.listdir(data_dir):
                if file.endswith('.json'):
                    json_files.append((os.path.join(data_dir, file), os.path.join('jamo', 'data')))
            
            if json_files:
                datas.extend(json_files)
                print(f"Added {len(json_files)} JSON files from jamo/data directory")
    
    except ImportError:
        # If jamo can't be imported, try to find it in site-packages
        site_packages = site.getsitepackages()
        for sp in site_packages:
            jamo_dir = os.path.join(sp, 'jamo')
            data_dir = os.path.join(jamo_dir, 'data')
            
            if os.path.exists(data_dir) and os.path.isdir(data_dir):
                # Find all .json files in data directory
                json_files = []
                for file in os.listdir(data_dir):
                    if file.endswith('.json'):
                        json_files.append((os.path.join(data_dir, file), os.path.join('jamo', 'data')))
                
                if json_files:
                    datas.extend(json_files)
                    print(f"Added {len(json_files)} JSON files from jamo/data directory")
                    break

# Collect all submodules
hiddenimports = collect_submodules('jamo')
