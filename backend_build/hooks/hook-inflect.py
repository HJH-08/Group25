"""PyInstaller hook for inflect package"""
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Make sure all submodules are included
hiddenimports = collect_submodules('inflect')
hiddenimports.extend(collect_submodules('typeguard'))

# Include data files
datas = collect_data_files('inflect')