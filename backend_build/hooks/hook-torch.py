# hook-torch.py
from PyInstaller.utils.hooks import collect_all, collect_submodules, copy_metadata

# Collect everything related to torch
datas, binaries, hiddenimports = collect_all('torch')

# Add specific libs that might be missed
import torch
import os

torch_path = os.path.dirname(torch.__file__)
torch_lib_path = os.path.join(torch_path, 'lib')

if os.path.exists(torch_lib_path):
    for lib_file in os.listdir(torch_lib_path):
        if lib_file.endswith('.so') or lib_file.endswith('.dylib') or lib_file.endswith('.dll'):
            binaries.append((os.path.join(torch_lib_path, lib_file), 'torch/lib'))

# Include MPS backend for Mac
if os.path.exists(os.path.join(torch_path, 'backends', 'mps')):
    hiddenimports.extend(['torch.backends.mps'])
