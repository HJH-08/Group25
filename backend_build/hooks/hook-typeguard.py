# hook-typeguard.py
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Make sure all typeguard submodules are included
hiddenimports = collect_submodules('typeguard')

# Include any data files
datas = collect_data_files('typeguard')
