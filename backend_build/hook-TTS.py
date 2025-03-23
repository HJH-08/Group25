# hook-TTS.py
from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs
import os
import TTS

# Find the TTS package directory
tts_package_dir = os.path.dirname(TTS.__file__)

# Collect VERSION file
datas = [(os.path.join(tts_package_dir, 'VERSION'), 'TTS')]

# Collect all TTS data files
tts_data_files = collect_data_files('TTS')
datas.extend(tts_data_files)

# Collect any dynamic libraries used by TTS
binaries = collect_dynamic_libs('TTS')
